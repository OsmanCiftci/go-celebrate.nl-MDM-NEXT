module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/attribute-definition-list',
            handler: 'attribute-definition.list',
            config: {
                policies: []
            }
        }
    ]
}