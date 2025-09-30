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
  ],
};
