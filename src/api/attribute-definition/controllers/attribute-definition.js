'use strict';

/**
 *  attribute-definition controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::attribute-definition.attribute-definition', ({ strapi }) => ({
    async list(ctx) {
        ctx.request.query.pagination = {
            limit: -1
        }
        ctx.request.query.populate = ['attributeType']

        /* const entities = await super.find(ctx) */

        const entities = await strapi.entityService.findMany('api::attribute-definition.attribute-definition', {
            locale: 'all',
            populate: ['attributeType'],
            sort: ['locale', 'attributeType.name', 'name']
        })

        return entities.map((entity) => {
            const sanitized = this.sanitizeOutput(entity, ctx)
            // Add value key so we can use as JSON data source for Storyblok list
            if (entity.attributeType) {
                sanitized.name = `${entity.locale} / ${entity.attributeType.name} / ${entity.name}`
            } else {
                sanitized.name = `${entity.locale} / ${entity.name}`
            }
            sanitized.value = entity.key
            return sanitized
        }
        );
    },
}));
