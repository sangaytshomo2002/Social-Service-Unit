// controllers/authControllers.js
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { pool } = require('../config/db');
require('dotenv').config();

// Load admin credentials from environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Development mode check
const isDevelopment = process.env.NODE_ENV === 'development';

// Page Handlers
exports.getLoginPage = (req, res) => {
  if (req.session.user) return res.redirect('/home');
  res.render('login', { user: req.session.user, error: null });
};

exports.getHomePage = (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('home', { 
    user: req.session.user,
    title: 'Home - Social Service Unit'
  });
};

exports.getLandingPage = (req, res) => {
  res.render('landing');
};

exports.getDashboardPage = async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/login');
  }

  try {
    // Fetch recent user registrations (last 30 days)
    const recentUsers = await pool.query(`
      SELECT 
        id,
        name,
        email,
        studentid,
        course,
        phone,
        created_at,
        is_verified,
        EXTRACT(EPOCH FROM (NOW() - created_at)) as time_ago
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    // Fetch user statistics
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_verified = false THEN 1 END) as pending_users,
        COUNT(CASE WHEN is_verified = true THEN 1 END) as approved_users
      FROM users
    `);

    res.render('dashboard', { 
      user: req.session.user,
      title: 'Admin Dashboard',
      recentUsers: recentUsers.rows || [],
      stats: stats.rows[0] || {
        total_users: 0,
        pending_users: 0,
        approved_users: 0
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Provide default values in case of error
    res.render('dashboard', { 
      user: req.session.user,
      title: 'Admin Dashboard',
      recentUsers: [],
      stats: {
        total_users: 0,
        pending_users: 0,
        approved_users: 0
      }
    });
  }
};

// Signup Handler
exports.registerUser = async (req, res) => {
  console.log('📝 Signup request received:', {
    body: { ...req.body, password: '[REDACTED]' },
    headers: req.headers
  });
  
  const { name, email, password, confirmPassword, studentId, course, cid, phone } = req.body;

  try {
    // Validate input
    if (!name || !email || !password || !confirmPassword || !studentId || !course || !cid || !phone) {
      console.log('❌ Validation failed: Missing required fields');
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      console.log('❌ Validation failed: Passwords do not match');
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      console.log('❌ Validation failed: Password too short');
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Validation failed: Invalid email format');
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    // Student ID validation
    const studentIdRegex = /^\d{8}$/;
    if (!studentIdRegex.test(studentId)) {
      console.log('❌ Validation failed: Invalid student ID format');
      return res.status(400).json({ success: false, message: 'Student ID must be 8 digits' });
    }

    console.log('✅ Input validation passed');

    try {
      // Create user
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log('✅ Password hashed successfully');

      // Generate verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'user',
        studentId,
        course,
        cid,
        phone,
        verification_code: verificationCode,
        verification_expires: verificationExpires,
        is_verified: false
      });

      // Send verification email
      const { sendVerificationEmail } = require('../utils/emailUtils');
      await sendVerificationEmail(email, verificationCode);

      // Set session for verification
      req.session.pendingVerificationEmail = email;

      console.log('✅ User created successfully:', { id: newUser.id, email: newUser.email });

      // Set session
      req.session.signupSuccess = true;
      req.session.userEmail = email;

      console.log('✅ Session set successfully');

      return res.status(200).json({ 
        success: true, 
        message: 'Signup successful',
        redirectUrl: '/login'
      });

    } catch (dbError) {
      console.error('❌ Database operation failed:', {
        error: dbError,
        code: dbError.code,
        message: dbError.message,
        detail: dbError.detail
      });

      if (dbError.message === 'Email is already registered') {
        return res.status(400).json({ 
          success: false, 
          message: 'This email address is already registered'
        });
      }

      if (dbError.message === 'Student ID is already registered') {
        return res.status(400).json({ 
          success: false, 
          message: 'This Student ID is already registered'
        });
      }

      // Log the full error for debugging
      console.error('Detailed error:', dbError);

      return res.status(500).json({ 
        success: false, 
        message: 'A database error occurred. Please try again.'
      });
    }

  } catch (err) {
    console.error('❌ Unexpected error during signup:', {
      error: err,
      stack: err.stack,
      message: err.message
    });

    return res.status(500).json({ 
      success: false, 
      message: 'An unexpected error occurred. Please try again.'
    });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Received login request:', {
      email,
      isAdminEmail: email === ADMIN_EMAIL
    });

    // Admin Login
    if (email === ADMIN_EMAIL) {
      if (password === ADMIN_PASSWORD) {
        console.log('✅ Admin credentials matched!');
        req.session.user = {
          name: 'Admin',
          email: ADMIN_EMAIL,
          role: 'admin'
        };

        const redirectUrl = '/dashboard';
        return res.json({
          success: true,
          message: 'Admin login successful',
          redirectUrl
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid admin password'
        });
      }
    }

    // Regular User Login
    console.log('👤 Processing regular user login');
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if email is verified
    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in.',
        redirectUrl: '/verify-email'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    const redirectUrl = '/home';
    return res.json({
      success: true,
      message: 'Login successful',
      redirectUrl
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Logout Handler
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Error destroying session:', err);
    res.redirect('/login');
  });
};

// Email Verification Handler
exports.verifyEmail = async (req, res) => {
  try {
    const { code } = req.body;
    const email = req.session.pendingVerificationEmail;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Session expired. Please try again.' 
      });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'User not found.' 
      });
    }

    if (!user.verification_code || !user.verification_expires) {
      return res.status(400).json({ 
        success: false, 
        message: 'No verification code found. Please request a new one.' 
      });
    }

    if (user.verification_code !== code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code.' 
      });
    }

    if (new Date() > new Date(user.verification_expires)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Verification code has expired. Please request a new one.' 
      });
    }

    // Update user verification status
    await pool.query(`
      UPDATE users 
      SET is_verified = true,
          verification_code = NULL,
          verification_expires = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE email = $1
    `, [email]);

    // Clear verification session data
    delete req.session.pendingVerificationEmail;
    delete req.session.signupSuccess;
    delete req.session.userEmail;

    return res.json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
      redirectUrl: '/login'
    });

  } catch (error) {
    console.error('❌ Verification error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred during verification' 
    });
  }
};

// Resend Verification Code Handler
exports.resendVerification = async (req, res) => {
  try {
    const email = req.session.pendingVerificationEmail;
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Session expired. Please sign up again.' 
      });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found.' 
      });
    }

    // Generate new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update verification code in database
    await pool.query(`
      UPDATE users 
      SET verification_code = $1,
          verification_expires = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE email = $3
    `, [verificationCode, verificationExpires, email]);

    // Send new verification email
    const { sendVerificationEmail } = require('../utils/emailUtils');
    const emailSent = await sendVerificationEmail(email, verificationCode);
    
    if (!emailSent) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send verification email. Please try again.' 
      });
    }

    return res.json({ 
      success: true, 
      message: 'New verification code sent to your email!' 
    });

  } catch (error) {
    console.error('❌ Resend verification error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred while resending verification code' 
    });
  }
};
