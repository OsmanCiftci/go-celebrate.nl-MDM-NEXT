module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/migrate-offerings',
            handler: 'vendor.migrate',
            config: {
                policies: []
            }
        },
        {
            method: 'GET',
            path: '/migrate-contacts',
            handler: 'vendor.migrateContacts',
            config: {
                policies: []
            }
        },
        {
            method: 'GET',
            path: '/bulk-update-statuses',
            handler: 'vendor.bulkUpdateStatuses',
            config: {
                policies: []
            }
        }
    ]
}