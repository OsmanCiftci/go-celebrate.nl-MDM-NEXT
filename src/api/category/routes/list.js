module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/categories-list',
            handler: 'category.list',
            config: {
                policies: []
            }
        }
    ]
}