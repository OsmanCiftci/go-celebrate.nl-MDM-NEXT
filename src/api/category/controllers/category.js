'use strict';

/**
 *  category controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::category.category', ({ strapi }) => ({
    async list(ctx) {
        let entities;
        /* if (ctx.query._q) {
            entities = await strapi.services.category.search(ctx.query)
        } else {
        } */
        ctx.request.query.pagination = { limit: -1 }
        entities = await super.find(ctx)

        return entities.data.map((entity) => {
            const sanitized = this.sanitizeOutput(entity, ctx)
            // Add value key so we can use as JSON data source for Storyblok list
            sanitized.name = entity.attributes.name
            sanitized.value = entity.attributes.key
            return sanitized
        }
        );
    },
}));
