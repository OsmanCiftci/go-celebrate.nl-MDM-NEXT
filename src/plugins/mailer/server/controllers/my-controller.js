'use strict';

module.exports = {
  index(ctx) {
    ctx.body = strapi
      .plugin('mailer')
      .service('myService')
      .getWelcomeMessage();
  },
};
