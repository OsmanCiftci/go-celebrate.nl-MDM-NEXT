'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }) {
    const extensionService = strapi.plugin('graphql').service('extension')
    const extension = ({ nexus }) => ({
      types: [
        nexus.objectType({
          name: 'booking',
          definition(t) {
            t.id('id', { description: 'Unique identifier for the booking' })
            t.string('message')
          }
        }),
        nexus.queryType({
          definition(t) {
            t.field('booking', {
              type: 'booking',
              args: {
                id: nexus.idArg({ description: 'Unique identifier for the booking' })
              }
            })
          }
        }),
        nexus.mutationType({
          definition(t) {
            t.field('createRfq', {
              type: 'RequestForQuoteEntity',
              args: {
                message: nexus.stringArg({ description: 'Message for the booking' }),
                user: 'UsersPermissionsUserInput',
                event: 'EventInput',
                eventServices: nexus.list(nexus.nonNull('EventServiceInput')),
                locale: 'I18NLocaleCode'
              }
            })
          }
        })
      ],
      definition: `
        type Booking {
            id: ID!
            message: String
        }
    `,
      query: `
        booking(id: ID!): Booking
    `,
      type: {},
      resolvers: {
        Query: {
          booking: {
            description: 'Return a booking',
            async resolve(parent, args, ctx = {}) {
              const {
                koaContext: {
                  request = {},
                  response
                }
              } = ctx
              const {
                header // Check if we have a valid token
              } = request
              const bookingController = strapi.controller('api::booking.booking')
              if (!bookingController) return null
              return await bookingController.exampleAction(args, ctx, strapi)
            }
          }
        },
        Mutation: {
          createRfq: {
            description: 'Create a new booking',
            async resolve(parent, args, ctx = {}) {
              const {
                koaContext: {
                  request = {},
                  response
                }
              } = ctx
              const {
                header // Check if we have a valid token
              } = request
              const bookingController = strapi.controller('api::booking.booking')
              if (!bookingController) return null
              return await bookingController.createRfq(args, ctx, strapi)
            }
          }
        },
      },
      resolversConfig: {
        'Query.booking': {
          auth: false,
        },
        'Query.user': {
          policies: [
            (context, { strapi }) => {
              /**
               * If 'event' have a parent, the function returns true,
               * so the request won't be blocked by the policy.
               */ 
              return context.parent !== undefined;
            }
          ],
          auth: false,
        },
        'Query.event': {
          policies: [
            (context, { strapi }) => {
              /**
               * If 'event' have a parent, the function returns true,
               * so the request won't be blocked by the policy.
               */ 
              return context.parent !== undefined;
            }
          ],
          auth: false,
        },
        'Mutation.createRfq': {
          policies: [
            (context, { strapi }) => {
              // Always return true
              console.log(context)
              return true
            }
          ],
          auth: false,
        },
      },
    })
    extensionService.use(extension)
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/*{ strapi }*/) { },
};
