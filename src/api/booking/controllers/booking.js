'use strict';
const jwt = require('jsonwebtoken')
const cryptoRandomString = require('crypto-random-string')

/**
 * A set of functions called "actions" for `booking`
 */

module.exports = {
  async createRfq({
    message, // String
    user, // Object as an rfq has only one user | UsersPermissionsUserInput
    event, // Object as an rfq has only one event | EventInput
    eventServices = [], // Should be array as we support more | [EventServiceInput]
    locale // I18NLocaleCode
  }, ctx, strapi) {
    let userId = null
    // We match users based on their emails, so there are no duplicates
    const existingUsers = await strapi.entityService.findMany('plugin::users-permissions.user', {
      filters: { email: user.email }
    })
    if (existingUsers && existingUsers.length > 0) {
      // Assign existing userID
      console.log('User exists', existingUsers[0])
      userId = existingUsers[0].id
    } else {
      try {
        // Create a new user
        const newUser = await strapi.entityService.create('plugin::users-permissions.user', {
          data: {
            ...user,
            role: 1 // ID for Authenticated user
          }
        })
        if (!newUser) throw ('User couldn\'t be created')
        // Assign the user ID so later we can set it on the booking as a relation
        userId = newUser.id
        console.log('New user created', newUser)
      } catch (error) {
        throw(error)
      }
    }

    // Create event services (currently there's one incoming) from the eventServices array | api::event-service.event-service
    // (event can have multiple (event)services. An eventService is made for a certain category, consists preferences, and will hold bids from vendors)
    const eventServiceIds = []
    for (let service of eventServices) {
      /* const transformedService = {}
      Object.keys(service).map(field => {
        if (Array.isArray(service[field])) {
          // Relations must be INTs but we might have received strings
          transformedService[field] = service[field].map(item => parseInt(item))
        } else {
          transformedService[field] = service[field]
        }
      }) */
      const newService = await strapi.entityService.create('api::event-service.event-service', {
        data: service
      })
      if (newService) eventServiceIds.push(newService.id)
    }

    // Create a new event, with the userId and everServices IDs assigned | api::event.event
    const newEvent = await strapi.entityService.create('api::event.event', {
      data: {
        ...event,
        eventServices: eventServiceIds
      },
      populate: ['occasion']
    })


    // Generate a title (location + date + occasion)
    // Find the rfq-title translation
    const translations = await strapi.entityService.findMany('api::translation.translation', {
      filters: { key: 'rfq-title' },
      locale
    })

    let title = ''

    if (translations && translations[0]) {
      const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      const startDateObject = newEvent.startDate ? new Date(newEvent.startDate) : null
      const startDateFormatted = startDateObject ? startDateObject.toLocaleDateString(locale || 'nl', dateOptions) : null
      if (newEvent.occasion) {
        title = translations[0].text.replace('{{occasion}}', newEvent.occasion.name)
      }
      title = `${title.replace('{{startDate}}', startDateFormatted)}`
    }

    // Generate a token, so the user will be able to view the event without logging in
    let token = ''
    if (user) {
      token = jwt.sign({ email: user.email }, process.env.JWT_SECRET)
    }

    const quoteNumber = `${cryptoRandomString(3)}-${cryptoRandomString(3)}-${cryptoRandomString(3)}`

    // Create a requestForQuote, and assign the event, user and message | api::request-for-quote.request-for-quote
    const newRfq = await strapi.entityService.create('api::request-for-quote.request-for-quote', {
      data: {
        event: newEvent.id,
        user: userId,
        title,
        token,
        quoteNumber
      },
      populate: ['event']
    })

    // Finally, create a deal in pipedrieve
    // Get the attributeDefinitions for the preferences to get their pipedriveId fields!

    // Set the dealId on the requestForQuote

    return newRfq
  },
  async exampleAction(ctx, next, foo) {
    try {
      console.log('Foooo', ctx, next, foo)
      const format = 'document'

      return {
        id: '1',
        message: 'Hello World'
      }
    } catch (err) {
      ctx.body = err;
    }
  }
};
