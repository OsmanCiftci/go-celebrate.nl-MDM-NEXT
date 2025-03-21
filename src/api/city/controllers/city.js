'use strict';

/**
 *  city controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::city.city', ({ strapi }) => ({
    async list(ctx) {
        ctx.request.query.pagination = {
            limit: -1
        }
        ctx.request.query.populate = ['region', 'county']

        const entities = await super.find(ctx)

        return entities.data.map((entity) => {
            const sanitized = this.sanitizeOutput(entity, ctx)
            // Add value key so we can use as JSON data source for Storyblok list
            if (entity.attributes.county && entity.attributes.county.data) {
                sanitized.name = `${entity.attributes.name} (${entity.attributes.county.data.attributes.name})`
            } else if (entity.attributes.region && entity.attributes.region.data) {
                sanitized.name = `${entity.attributes.name} (${entity.attributes.region.data.attributes.name})`
            } else {
                sanitized.name = entity.attributes.name
            }
            sanitized.value = entity.attributes.key
            return sanitized
        }
        );
    },
}));
