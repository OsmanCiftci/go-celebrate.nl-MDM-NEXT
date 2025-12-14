"use strict";

const { createCoreController } = require("@strapi/strapi").factories;
const jwt = require("jsonwebtoken");
const cryptoRandomString = require("crypto-random-string");

// Controller that extends Strapi core controller (create/find/findOne/update/delete),
// and adds a custom action createRfq. This fixes "Handler not found booking.create"
// because core CRUD handlers are now provided by createCoreController.
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
      const payload = {
        firstName: body.firstName ?? null,
        lastName: body.lastName ?? null,
        company: body.company ?? null,
        email: body.email ?? null,
        phone: body.phone ?? null,
        city: body.city ?? null,
        startDate: body.startDate ?? null, // "YYYY-MM-DD"
        endDate: body.endDate ?? null, // "YYYY-MM-DD"
        eventType: body.eventType ?? null,
        services: body.services ?? [], // json (array)
        foodsdrinks: body.foodsdrinks ?? [], // json (array)
        dietary: body.dietary ?? null,
        guests: body.guests ?? null, // integer
        // DECIMAL alanlar bazı DB'lerde string ister; gerekirse String() kullan:
        budgetPerGuests: body.budgetPerGuests ?? null, // decimal
        details: body.details ?? null,
        whopays: body.whopays ?? null, // schema'na eklediysen
        selectedOfferings: body.selectedOfferings ?? [], // json (array of objects with id and name)
        // default true istiyorsan burada zorla:
        voorwaarden: body.voorwaarden === undefined ? true : !!body.voorwaarden,
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
      strapi.log.error("publicCreate failed", error);
      // Geliştirme kolaylığı için hata detayını döndür (prod'da sadeleştirebilirsin)
      ctx.status = 500;
      ctx.body = { error: error.message };
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
