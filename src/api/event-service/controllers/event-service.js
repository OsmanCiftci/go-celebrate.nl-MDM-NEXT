'use strict';

/**
 *  event-service controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::event-service.event-service');
