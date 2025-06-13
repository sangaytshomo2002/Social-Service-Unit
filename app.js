// Load environment variables
require('dotenv').config();

// Import dependencies
const express = require('express');
const path = require('path');
const session = require('express-session');
const { pool } = require('./config/db');
const { initializeDatabase } = require('./config/initDb');

// Import middleware
const { logRequest } = require('./middleware/auth');

// Import route modules
const authRoutes = require('./routes/authRoutes');       // /signup, /login, /verify-email
const contactRoutes = require('./routes/contactRoutes'); // /contact, etc.
const adminRoutes = require('./routes/adminRoutes');     // /admin panel routes
const eventRoutes = require('./routes/eventRoutes');     // /events routes

// Create Express app
const app = express();

// Environment setup
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 3000;

// Initialize database tables
initializeDatabase().catch(err => {
    console.error('Failed to initialize database tables:', err);
    process.exit(1);
});

// Log important ENV (only in development)
if (NODE_ENV === 'development') {
    console.log('✅ ENV Check:', {
        ADMIN_EMAIL: process.env.ADMIN_EMAIL,
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD
    });
}

// Session configuration
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'your_super_secret_key_here',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: NODE_ENV === 'production', // only use secure cookies in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
};

// ======= MIDDLEWARE ======= //
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session(sessionConfig));
app.use(logRequest); // Custom logging middleware

// ======= VIEW ENGINE ======= //
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ======= ROUTES ======= //
app.use('/', authRoutes);      // Auth pages (login, signup, verification)
app.use('/admin', adminRoutes); // Admin dashboard routes
app.use('/contact', contactRoutes); // Contact form routes
app.use('/events', eventRoutes);     // Event routes

// User events route
app.get('/userevents', (req, res) => {
    res.redirect('/events/user');
});

// ======= ERROR HANDLING ======= //
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        message: 'Something broke!',
        error: NODE_ENV === 'development' ? err : {}
    });
});

// ======= START SERVER ======= //
app.listen(PORT, () => {
    console.log(`✅ Server is running at http://localhost:${PORT} in ${NODE_ENV} mode`);
});

module.exports = app;
