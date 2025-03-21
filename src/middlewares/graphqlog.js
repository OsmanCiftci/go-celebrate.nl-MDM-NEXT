module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // apply only if it's a GrahQL request
    if (ctx.request.url === '/graphql') {
      // execute the middleware stack
      await next();

      // then logs info
      console.log('REQUEST:')
      console.log(ctx.request.body.variables);
      console.log(ctx.request.body.query);
      console.log('RESPONSE:')
      console.log(ctx.body);
    } else {
      // just exec the mileware stack for other requests
      await next();
    }
  }
};