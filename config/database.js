module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    // Login details for the database (Supabase), from the Render environment variables.
    connection: {
      host: env('DATABASE_HOST'),
      port: env.int('DATABASE_PORT'),
      database: env('DATABASE_NAME'),
      user: env('DATABASE_USERNAME'),
      password: env('DATABASE_PASSWORD'),
      ssl: env.bool('DATABASE_SSL', false) ? { rejectUnauthorized: false } : false,
    },
    // Connection pool: at most 6 database connections at the same time.
    pool: {
      min: 0, // default 2
      max: 6, // default 10
      // How long a query may wait for a free connection before it fails.
      // Was 300000 (5 min), but Knex never waits longer than acquireConnectionTimeout (default 60 s), so it was really 60 s.
      // 20 s: when Strapi is overloaded, waiting requests fail sooner instead of piling up in memory
      // (Render killed Strapi for using too much memory on 2026-11-07, TODO MEM-1).
      acquireTimeoutMillis: 20000,
    },
    acquireConnectionTimeout: 20000,
  },
});
