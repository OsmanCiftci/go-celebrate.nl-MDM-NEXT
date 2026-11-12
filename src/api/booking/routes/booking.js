module.exports = {
  routes: [
    {
      method: "POST",
      path: "/bookings",
      handler: "booking.create",
    },
    {
      method: "GET",
      path: "/bookings",
      handler: "booking.find",
    },
    {
      method: "GET",
      path: "/bookings/:id",
      handler: "booking.findOne",
    },
    {
      method: "PUT",
      path: "/bookings/:id",
      handler: "booking.update",
    },
    {
      method: "DELETE",
      path: "/bookings/:id",
      handler: "booking.delete",
    },

    {
      method: "POST",
      path: "/create-rfq",
      handler: "booking.createRfq",
      config: {
        policies: [],
      },
    },
    {
      method: "POST",
      path: "/bookings/public", // => POST /api/bookings/public
      handler: "booking.publicCreate",
      config: {
        auth: false, 
        policies: [],
        middlewares: [],
      },
    },
    {
      // Finish an unfinished booking from the same form (one-time key, 60 minutes), see controller publicUpdate
      method: "PUT",
      path: "/bookings/public/:id",
      handler: "booking.publicUpdate",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
