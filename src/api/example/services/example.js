'use strict';

/**
 * example service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::example.example');
