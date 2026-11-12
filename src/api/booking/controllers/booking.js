"use strict";

const { createCoreController } = require("@strapi/strapi").factories;
const jwt = require("jsonwebtoken");
const cryptoRandomString = require("crypto-random-string");

// Controller that extends Strapi core controller (create/find/findOne/update/delete),
// and adds a custom action createRfq. This fixes "Handler not found booking.create"
// because core CRUD handlers are now provided by createCoreController.
// Booking form times arrive as "HH:mm"; Strapi's time field needs "HH:mm:ss.SSS".
// Anything that isn't a valid time becomes null, so a bad time never blocks a booking.
const toTime = (value) => {
  const m = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?/.exec(String(value ?? "").trim());
  return m ? `${m[1]}:${m[2]}:${m[3] || "00"}.000` : null;
};

// Safety net for the public booking form (2026-11-12): one odd field must never lose the whole booking.
// Before this, an emptied number field (""), an e-mail like "naam@bedrijf" or text over 255 characters made Strapi
// refuse the booking, and the visitor only saw "Er is iets misgegaan".
const { yup } = require("@strapi/utils");
const MAX_STRING = 255; // Strapi "string" fields are varchar(255)
const toText = (value, max = MAX_STRING) => {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s === "" ? null : s.slice(0, max);
};
const toNumber = (value, { integer = false } = {}) => {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(String(value).replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return integer ? Math.round(n) : n;
};
const isEmail = (value) => !!value && yup.string().email().isValidSync(value); // the same check Strapi uses

module.exports = createCoreController("api::booking.booking", ({ strapi }) => ({
  /**
   * Custom action: createRfq
   * Expects body:
   * {
   *   message: string,
   *   user: { email: string, ... },
   *   event: { ... },
   *   eventServices: [ { ... }, ... ],
   *   locale: 'nl' | 'en' | ...
   * }
   */

  async publicCreate(ctx) {
    try {
      const body = ctx.request?.body?.data || ctx.request?.body || {};

      // ---- Whitelist/map only the fields you expect from the form ----
      // An e-mail Strapi would refuse is not stored as e-mail (that failed the whole booking) but kept in the details,
      // so Mathilde can still read what the visitor typed.
      const email = toText(body.email);
      const emailOk = !email || isEmail(email);
      const details = [toText(body.details, 20000), emailOk ? null : `E-mail zoals ingevuld (ongeldig): ${email}`]
        .filter(Boolean)
        .join("\n\n") || null;

      const payload = {
        firstName: toText(body.firstName),
        lastName: toText(body.lastName),
        company: toText(body.company),
        email: emailOk ? email : null,
        phone: toText(body.phone),
        city: toText(body.city),
        startDate: body.startDate ?? null, // "YYYY-MM-DD"
        endDate: body.endDate ?? null, // "YYYY-MM-DD"
        startTime: toTime(body.startTime), // "HH:mm" → "HH:mm:00.000" (serving hours, Mathilde 2026-11)
        endTime: toTime(body.endTime),
        eventType: toText(body.eventType),
        services: Array.isArray(body.services) ? body.services : [], // json (array)
        foodsdrinks: Array.isArray(body.foodsdrinks) ? body.foodsdrinks : [], // json (array)
        dietary: toText(body.dietary, 5000), // text field (was string(255): long wishes failed the booking)
        guests: toNumber(body.guests, { integer: true }), // integer; "" or rubbish → empty
        budgetPerGuests: toNumber(body.budgetPerGuests), // decimal
        details,
        whopays: toText(body.whopays),
        selectedOfferings: body.selectedOfferings ?? [], // json (array of objects with id and name)
        // Terms accepted? The database field is spelled "voorwarden" (old typo, kept to avoid a column rename).
        // Only an explicit yes counts; before 2026-11-12 this wrote to a non-existent field, so older bookings are empty.
        voorwarden: body.voorwaarden === true || body.voorwaarden === "Ja",
      };

      // create
      const created = await strapi.entityService.create(
        "api::booking.booking",
        {
          data: payload,
        }
      );

      ctx.status = 201;
      ctx.body = { data: created };
    } catch (error) {
      // Full reason in the Render log only; visitors no longer see database details (SQL, column names)
      strapi.log.error(`publicCreate failed: ${error.message}`, error);
      ctx.status = 500;
      ctx.body = { error: "Booking could not be saved" };
    }
  },

  async createRfq(ctx) {
    try {
      const {
        message,
        user,
        event,
        eventServices = [],
        locale,
      } = ctx.request.body || {};

      if (!user || !user.email) {
        return ctx.badRequest("user.email is required");
      }

      // Find or create user by email
      let userId = null;
      const existingUsers = await strapi.entityService.findMany(
        "plugin::users-permissions.user",
        {
          filters: { email: user.email },
          limit: 1,
        }
      );

      if (existingUsers && existingUsers.length > 0) {
        userId = existingUsers[0].id;
      } else {
        const newUser = await strapi.entityService.create(
          "plugin::users-permissions.user",
          {
            data: {
              ...user,
              role: 1, // Authenticated role id (adjust if needed)
            },
          }
        );
        if (!newUser) {
          return ctx.internalServerError(`User couldn't be created`);
        }
        userId = newUser.id;
      }

      // Create event services and collect their ids
      const eventServiceIds = [];
      for (const service of eventServices) {
        const newService = await strapi.entityService.create(
          "api::event-service.event-service",
          {
            data: service,
          }
        );
        if (newService) eventServiceIds.push(newService.id);
      }

      // Create the event and link eventServices
      const newEvent = await strapi.entityService.create("api::event.event", {
        data: {
          ...(event || {}),
          eventServices: eventServiceIds,
        },
        populate: ["occasion"],
      });

      // Build title (occasion + date) using translations
      const translations = await strapi.entityService.findMany(
        "api::translation.translation",
        {
          filters: { key: "rfq-title" },
          locale,
          limit: 1,
        }
      );

      let title = "";
      if (translations && translations[0]) {
        const dateOptions = {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        };
        const startDateObject = newEvent.startDate
          ? new Date(newEvent.startDate)
          : null;
        const startDateFormatted = startDateObject
          ? startDateObject.toLocaleDateString(locale || "nl", dateOptions)
          : null;
        if (newEvent.occasion) {
          title = translations[0].text.replace(
            "{{occasion}}",
            newEvent.occasion.name
          );
        }
        title = `${title.replace("{{startDate}}", startDateFormatted)}`;
      }

      // View token for user
      let token = "";
      if (user?.email) {
        token = jwt.sign({ email: user.email }, process.env.JWT_SECRET);
      }

      const quoteNumber = `${cryptoRandomString(3)}-${cryptoRandomString(
        3
      )}-${cryptoRandomString(3)}`;

      // Create RFQ and link user + event
      const newRfq = await strapi.entityService.create(
        "api::request-for-quote.request-for-quote",
        {
          data: {
            event: newEvent.id,
            user: userId,
            title,
            token,
            quoteNumber,
            message: message || null,
          },
          populate: ["event"],
        }
      );

      ctx.body = newRfq;
    } catch (error) {
      strapi.log.error("createRfq failed", error);
      return ctx.internalServerError(error?.message || "createRfq failed");
    }
  },

  // Example passthrough action (optional)
  async exampleAction(ctx) {
    try {
      return { id: "1", message: "Hello World" };
    } catch (err) {
      return ctx.internalServerError(err?.message || "exampleAction failed");
    }
  },
}));
