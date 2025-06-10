const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllers');

router.get('/', authController.getLandingPage);

// ✅ Define route handlers for each page
router.get('/', (req, res) => res.render('home'));
router.get('/about', (req, res) => res.render('about'));
router.get('/services', (req, res) => res.render('services'));
router.get('/contact', (req, res) => res.render('contact'));

module.exports = router;

