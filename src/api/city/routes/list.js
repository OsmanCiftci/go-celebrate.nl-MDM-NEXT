module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/city-list',
            handler: 'city.list',
            config: {
                policies: []
            }
        }
    ]
}