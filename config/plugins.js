module.exports = ({ env }) => ({
    upload: {
        config: {
            provider: 'supabase',
            providerOptions: {
                apiUrl: process.env.SUPABASE_API_URL,
                apiKey: process.env.SUPABASE_API_KEY,
                bucket: process.env.SUPABASE_BUCKET,
                directory: process.env.SUPABASE_DIRECTORY,
                options: {}
            }
        },
    },
    slugify: {
        enabled: false,
        config: {
            contentTypes: {
                offering: {
                    field: 'slug',
                    references: 'name',
                },
            },
        },
    },
    email: {
        config: {
            provider: 'sendgrid',
            providerOptions: {
                apiKey: env('SEND_GIRD_API_KEY'),
            },
            settings: {
                defaultFrom: 'hello@go-celebrate.com',
                defaultReplyTo: 'bence@go-celebrate.com',
                testAddress: 'bence.husi@gmail.com',
                name: 'Go Celebrate'
            },
        },
    },
    mailer: {
        enabled: true,
        resolve: './src/plugins/mailer'
    },
});