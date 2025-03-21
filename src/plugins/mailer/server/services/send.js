'use strict';

const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SEND_GRID_API_KEY)

module.exports = ({ strapi }) => ({
    async test({
        to,
        dynamicTemplateData = {},
    } = {}) {
        return await sgMail.send({
            from: {
                email: 'hello@go-celebrate.com',
                name: 'Go Celebrate',
            },
            templateId: 'd-0c37343b0a2b4a2cb46933dbab6f481d',
            personalizations: [
                {
                    to,
                    subject: `Bence, Your proposal is ready`,
                    dynamicTemplateData
                },
                {
                    to: 'bence@ollaladesign.nl',
                    subject: `Ollala, Your proposal is ready`,
                    dynamicTemplateData
                },
            ]
        })
    },
    async general({
        to,
        from = {
            email: 'hello@go-celebrate.com',
            name: 'Go Celebrate',
        },
        subject,
        text,
        html,
        templateId,
        dynamicTemplateData = {}
    } = {}) {
        if (!to) {
            throw new Error('No to address provided')
        }
        const msg = {
            to,
            from,
            subject,
            dynamicTemplateData
        }
        if (text && !templateId) {
            msg.text = text
        }
        if (html && !templateId) {
            msg.html = html
        }
        if (templateId) {
            msg.templateId = templateId
        }
        return await sgMail.send(msg)
    }
});
