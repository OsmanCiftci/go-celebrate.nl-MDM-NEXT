'use strict';
const jwt = require('jsonwebtoken')

/**
 *  example controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::example.example', ({ strapi }) => ({
    async email(id) {
        console.log(strapi.services)
        const emailService = strapi.service('plugin::mailer.send')
        try {
            return await emailService.test({
                to: 'bence.husi@gmail.com',
                dynamicTemplateData: {
                    firstName: 'John',
                    lastName: 'Doe',
                }
            })
        } catch (error) {
            console.log(error)
            return error
        }
    },
    async temporarayToken(ctx, foo) {
        const { email } = ctx.query
        const temporaryAccessToken = jwt.sign({ email: email }, process.env.JWT_SECRET)
        const decoded = jwt.verify(temporaryAccessToken, process.env.JWT_SECRET)
        if (decoded.email && decoded.email === email) {
            return {
                message: 'Valid token',
                temporaryAccessToken,
                decoded
            }
        }
        return {
            temporaryAccessToken,
            decoded
        }
    }
}));
