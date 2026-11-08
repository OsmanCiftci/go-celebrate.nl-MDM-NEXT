'use strict';

/**
 *  health-check controller (TODO TEST-2: test entries of the automatic site check)
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::health-check.health-check');
