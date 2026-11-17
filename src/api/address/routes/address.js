'use strict';

/**
 * address router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

// No public REST routes (TODO SEC-1, 2026-11-17): address records hold company and address details and were readable by anyone
// at /api/addresss. The website never uses them; the admin panel and the backend code (entityService) do not need these routes.
module.exports = createCoreRouter('api::address.address', { only: [] });
