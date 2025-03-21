'use strict';

/**
 *  region controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::region.region', ({ strapi }) => ({
    async list(ctx) {
        ctx.request.query.pagination = {
            limit: -1
        }
        ctx.request.query.populate = ['country']

        const entities = await super.find(ctx)

        return entities.data.map((entity) => {
            const sanitized = this.sanitizeOutput(entity, ctx)
            // Add value key so we can use as JSON data source for Storyblok list
            if (entity.attributes.country && entity.attributes.country.data) {
                sanitized.name = `${entity.attributes.name} (${entity.attributes.country.data.attributes.name})`
            } else {
                sanitized.name = entity.attributes.name
            }
            sanitized.value = entity.attributes.key
            return sanitized
        }
        );
    },
}));
