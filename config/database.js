module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST'),
      port: env.int('DATABASE_PORT'),
      database: env('DATABASE_NAME'),
      user: env('DATABASE_USERNAME'),
      password: env('DATABASE_PASSWORD'),
      // ssl: env.bool('DATABASE_SSL'),
      acquireTimeoutMillis: 300000,
      pool: {
        min: 0,  // default 2
        max: 6,  // default 10
        acquireTimeoutMillis: 300000,
      },
    },
    pool: {
      min: 0,  // default 2
      max: 6,  // default 10
      acquireTimeoutMillis: 300000,
    },
    acquireTimeoutMillis: 300000,
  },
});
