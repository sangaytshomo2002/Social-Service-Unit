const express = require('express');
const router = express.Router();
const { getContactPage, submitContactForm } = require('../controllers/contactController');

// Get contact page
router.get('/contact', getContactPage);

// Submit contact form
router.post('/contact', submitContactForm);

module.exports = router; 