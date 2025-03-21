module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/email',
            handler: 'example.email',
            config: {
                policies: []
            }
        },
        {
            method: 'GET',
            path: '/test-token',
            handler: 'example.temporarayToken',
            config: {
                policies: []
            }
        }
    ]
}