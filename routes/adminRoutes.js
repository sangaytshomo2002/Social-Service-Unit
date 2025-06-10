const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Admin login routes
router.get('/login', adminController.getLoginPage);
router.post('/login', adminController.login);

// Apply admin middleware to all routes
router.use(isAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// User management
router.post('/users/:userId/approve', adminController.approveUser);
router.post('/users/:userId/reject', adminController.rejectUser);
router.delete('/users/:userId', adminController.deleteUser);

module.exports = router; 