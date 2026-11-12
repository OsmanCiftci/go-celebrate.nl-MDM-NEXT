/**
 * Unit tests for the public booking form endpoints (controller src/api/booking/controllers/booking.js):
 *   POST /api/bookings/public      -> publicCreate
 *   PUT  /api/bookings/public/:id  -> publicUpdate (finish an unfinished booking with its one-time form key)
 *
 * No database and no running Strapi: a small in-memory stand-in for strapi.entityService.
 * Run (project root, Node 18+):  npm test
 * Written 2026-11-12 (TODO MF-13, Osman asked for these as repeatable tests).
 */
const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

// --- in-memory stand-in for Strapi ---------------------------------------------------------------
let rows;
let nextId;
const fakeStrapi = {
  log: { error: () => {} },
  entityService: {
    create: async (uid, { data }) => {
      const id = nextId++;
      rows[id] = { id, ...data };
      return { ...rows[id] };
    },
    findOne: async (uid, id) => (rows[id] ? { ...rows[id] } : null),
    update: async (uid, id, { data }) => {
      rows[id] = { ...rows[id], ...data };
      return { ...rows[id] };
    },
  },
};
global.strapi = fakeStrapi;

// Load only the custom actions of the controller (the core create/find/... actions need a real Strapi)
const factories = require("@strapi/strapi").factories;
const realCreateCoreController = factories.createCoreController;
factories.createCoreController = (uid, cfg) => cfg;
const controller = require(path.join(__dirname, "..", "src", "api", "booking", "controllers", "booking.js"))({
  strapi: fakeStrapi,
});
factories.createCoreController = realCreateCoreController;

const call = async (action, body, params = {}) => {
  const ctx = { request: { body: { data: body } }, params };
  await controller[action](ctx);
  return ctx;
};
const form = { firstName: "Claude", lastName: "Code", email: "claude@example.com", guests: 50 };
const saveUnfinished = async (extra = {}) => call("publicCreate", { ...form, voorwaarden: false, ...extra });

beforeEach(() => {
  rows = {};
  nextId = 1;
});

// --- publicCreate --------------------------------------------------------------------------------
test("unfinished booking (terms not accepted): 201, only id + 48-character form key back", async () => {
  const r = await saveUnfinished();
  assert.equal(r.status, 201);
  assert.deepEqual(Object.keys(r.body.data), ["id"]);
  assert.match(r.body.formToken, /^[0-9a-f]{48}$/);
});

test("unfinished booking row: terms false, key stored, key valid for 60 minutes", async () => {
  const r = await saveUnfinished();
  const row = rows[r.body.data.id];
  assert.equal(row.voorwarden, false);
  assert.equal(row.formToken, r.body.formToken);
  assert.ok(Math.abs(row.formTokenExpiresAt.getTime() - Date.now() - 60 * 60 * 1000) < 5000);
});

test("booking with terms accepted: no form key, terms true", async () => {
  const r = await call("publicCreate", { ...form, voorwaarden: "Ja" });
  assert.equal(r.status, 201);
  assert.equal(r.body.formToken, undefined);
  assert.equal(rows[r.body.data.id].voorwarden, true);
  assert.equal(rows[r.body.data.id].formToken, undefined);
});

test("terms: only an explicit yes counts (true or 'Ja')", async () => {
  const cases = [[true, true], ["Ja", true], [false, false], ["Nee", false], [undefined, false], ["true", false]];
  for (const [value, expected] of cases) {
    const r = await call("publicCreate", { ...form, voorwaarden: value });
    assert.equal(rows[r.body.data.id].voorwarden, expected, `voorwaarden=${value}`);
  }
});

test("safety net: emptied numbers and an odd e-mail never block the booking", async () => {
  const r = await call("publicCreate", { ...form, guests: "", budgetPerGuests: "abc", email: "naam@bedrijf", voorwaarden: "Ja" });
  const row = rows[r.body.data.id];
  assert.equal(r.status, 201);
  assert.equal(row.guests, null);
  assert.equal(row.budgetPerGuests, null);
  assert.equal(row.email, null);
  assert.match(row.details, /naam@bedrijf/);
});

test("times: 'HH:mm' stored as 'HH:mm:00.000', rubbish as empty", async () => {
  const r = await call("publicCreate", { ...form, startTime: "17:00", endTime: "25:99", voorwaarden: "Ja" });
  assert.equal(rows[r.body.data.id].startTime, "17:00:00.000");
  assert.equal(rows[r.body.data.id].endTime, null);
});

test("create error: visitor gets a short message, no database details", async () => {
  const realCreate = fakeStrapi.entityService.create;
  fakeStrapi.entityService.create = async () => {
    throw new Error('insert into "bookings" ... column x does not exist');
  };
  try {
    const r = await call("publicCreate", { ...form, voorwaarden: "Ja" });
    assert.equal(r.status, 500);
    assert.deepEqual(r.body, { error: "Booking could not be saved" });
  } finally {
    fakeStrapi.entityService.create = realCreate;
  }
});

// --- publicUpdate --------------------------------------------------------------------------------
test("finish with the right key: 200, only the id back, final values stored, key wiped", async () => {
  const draft = await saveUnfinished();
  const id = draft.body.data.id;
  const r = await call(
    "publicUpdate",
    { ...form, email: "nieuw@example.com", voorwaarden: "Ja", formToken: draft.body.formToken },
    { id: String(id) }
  );
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { data: { id } });
  assert.equal(rows[id].voorwarden, true);
  assert.equal(rows[id].email, "nieuw@example.com");
  assert.equal(rows[id].formToken, null);
  assert.equal(rows[id].formTokenExpiresAt, null);
});

test("the key works once only", async () => {
  const draft = await saveUnfinished();
  const args = [{ ...form, voorwaarden: "Ja", formToken: draft.body.formToken }, { id: String(draft.body.data.id) }];
  assert.equal((await call("publicUpdate", ...args)).status, 200);
  assert.equal((await call("publicUpdate", ...args)).status, 404);
});

test("refused (same 404 answer, row unchanged): wrong key, no key, unknown id, invalid id", async () => {
  const draft = await saveUnfinished();
  const id = String(draft.body.data.id);
  const cases = [
    [{ formToken: "x".repeat(48) }, { id }],
    [{}, { id }],
    [{ formToken: draft.body.formToken }, { id: "999" }],
    [{ formToken: draft.body.formToken }, { id: "abc" }],
    [{ formToken: draft.body.formToken }, { id: "-1" }],
  ];
  for (const [extra, params] of cases) {
    const r = await call("publicUpdate", { ...form, voorwaarden: "Ja", ...extra }, params);
    assert.equal(r.status, 404, JSON.stringify({ extra, params }));
    assert.deepEqual(r.body, { error: "Booking could not be updated" });
  }
  assert.equal(rows[id].voorwarden, false);
});

test("expired key (older than 60 minutes) is refused, row stays unfinished", async () => {
  const draft = await saveUnfinished();
  const id = draft.body.data.id;
  rows[id].formTokenExpiresAt = new Date(Date.now() - 1000);
  const r = await call("publicUpdate", { ...form, voorwaarden: "Ja", formToken: draft.body.formToken }, { id: String(id) });
  assert.equal(r.status, 404);
  assert.equal(rows[id].voorwarden, false);
});

test("the key of one booking cannot change another booking", async () => {
  const first = await saveUnfinished();
  const second = await saveUnfinished();
  const r = await call(
    "publicUpdate",
    { ...form, voorwaarden: "Ja", formToken: second.body.formToken },
    { id: String(first.body.data.id) }
  );
  assert.equal(r.status, 404);
  assert.equal(rows[first.body.data.id].voorwarden, false);
});

test("a booking created with terms accepted (no key) cannot be updated", async () => {
  const done = await call("publicCreate", { ...form, voorwaarden: "Ja" });
  const r = await call("publicUpdate", { ...form, firstName: "Iemand", formToken: "" }, { id: String(done.body.data.id) });
  assert.equal(r.status, 404);
  assert.equal(rows[done.body.data.id].firstName, "Claude");
});

test("finishing uses the same safety net as creating", async () => {
  const draft = await saveUnfinished();
  const id = draft.body.data.id;
  await call(
    "publicUpdate",
    { ...form, guests: "", email: "naam@bedrijf", voorwaarden: true, formToken: draft.body.formToken },
    { id: String(id) }
  );
  assert.equal(rows[id].guests, null);
  assert.equal(rows[id].email, null);
  assert.match(rows[id].details, /naam@bedrijf/);
  assert.equal(rows[id].voorwarden, true);
});
