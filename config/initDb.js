const { pool } = require('./db');

async function initializeDatabase() {
    try {
        // Create users table first
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                studentId VARCHAR(20) UNIQUE NOT NULL,
                course VARCHAR(100) NOT NULL,
                cid VARCHAR(20) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                verification_code VARCHAR(6),
                verification_expires TIMESTAMP,
                is_verified BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Users table initialized successfully');

        // Create events table with reference to users
        await pool.query(`
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                event_date TIMESTAMP NOT NULL,
                location VARCHAR(255),
                type VARCHAR(50),
                photo_url TEXT,
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Events table initialized successfully');

    } catch (error) {
        console.error('Error initializing database tables:', error);
        throw error;
    }
}

module.exports = { initializeDatabase }; 