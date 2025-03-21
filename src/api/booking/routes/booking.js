module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/create-rfq',
            handler: 'booking.createRfq',
            config: {
                policies: []
            }
        }
    ]
}