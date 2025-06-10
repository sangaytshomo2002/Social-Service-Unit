// Load environment variables
require('dotenv').config();

const { Pool } = require('pg');

// Environment variables
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 3000;

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'SocialServiceUnit',
  ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

console.log('Database configuration:', {
  user: dbConfig.user,
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  ssl: dbConfig.ssl,
});

const pool = new Pool(dbConfig);

// Initialize database connection
async function initializeDatabase() {
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Successfully connected to database');

    // Test query
    await client.query('SELECT NOW()');
    console.log('✅ Database test query successful');

    return true;
  } catch (err) {
    console.error('❌ Database initialization error:', {
      code: err.code,
      message: err.message,
      stack: err.stack,
    });
    throw err;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Run database initialization on startup
initializeDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Admin default config depending on environment
const adminConfig = {
  development: {
    name: process.env.ADMIN_NAME || 'Admin',
    email: process.env.ADMIN_EMAIL || 'admin@gmail.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
  production: {
    name: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },
};

// Session configuration for express-session
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your_super_secret_key_here',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
};

module.exports = {
  pool,
  sessionConfig,
  NODE_ENV,
  PORT,
  adminConfig: adminConfig[NODE_ENV],
};
