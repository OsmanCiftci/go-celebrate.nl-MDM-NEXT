'use strict';

/**
 * health-check router (TODO TEST-2).
 * Only what the site check needs: create an entry, read it back, delete it.
 * Access only with the dedicated API token (no public access).
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::health-check.health-check', {
  only: ['create', 'findOne', 'delete'],
});
