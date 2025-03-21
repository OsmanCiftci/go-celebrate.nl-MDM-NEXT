'use strict';

/**
 * request-for-quote service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::request-for-quote.request-for-quote');
