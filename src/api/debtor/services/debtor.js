'use strict';

/**
 * debtor service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::debtor.debtor');
