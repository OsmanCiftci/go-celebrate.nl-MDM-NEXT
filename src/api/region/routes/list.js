module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/region-list',
            handler: 'region.list',
            config: {
                policies: []
            }
        }
    ]
}