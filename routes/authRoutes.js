const express = require('express');
const router = express.Router();
const { 
  getLandingPage, 
  loginUser,
  getHomePage,
  getLoginPage,
  getDashboardPage,
  logout,
  registerUser,
  verifyEmail,
  resendVerification
} = require('../controllers/authControllers');

const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Public routes
router.get('/', getLandingPage);
router.get('/login', getLoginPage);
router.post('/login', loginUser);
router.get('/signup', (req, res) => res.render('signup'));
router.post('/signup', registerUser);

// Email verification routes
router.get('/verify-email', (req, res) => {
  if (!req.session.pendingVerificationEmail) {
    return res.redirect('/login');
  }
  res.render('verify-email', {
    email: req.session.pendingVerificationEmail
  });
});
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// Protected routes
router.get('/home', isAuthenticated, getHomePage);
router.get('/dashboard', isAuthenticated, isAdmin, getDashboardPage);
router.get('/logout', logout);

// Static pages
router.get('/about', (req, res) => res.render('about', { user: req.session.user }));
router.get('/contact', (req, res) => res.render('contact', { user: req.session.user }));
router.get('/abouts', (req, res) => res.render('abouts', { user: req.session.user }));
// Admin routes
router.get('/settings', isAuthenticated, isAdmin, (req, res) => {
  res.render('settings', { 
    user: req.session.user,
    animation: req.query.animate === 'true'
  });
});

router.get('/settings/transition', isAuthenticated, isAdmin, (req, res) => {
  res.json({ success: true });
});

module.exports = router;
