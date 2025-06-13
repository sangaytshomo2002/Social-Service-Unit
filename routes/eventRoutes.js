const express = require('express');
const router = express.Router();
const multer = require('multer');
const { isAdmin } = require('../middleware/auth');
const eventController = require('../controllers/eventController');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (!file) {
            return cb(null, true);
        }
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// ======= PUBLIC ROUTES ======= //
router.get('/user', eventController.getUserEventsPage);

// ======= ADMIN ROUTES ======= //
// Order matters: specific routes before dynamic ones
router.get('/', isAdmin, eventController.getEventsPage);
router.post('/', isAdmin, upload.single('photo'), eventController.createEvent);
router.get('/:id', isAdmin, eventController.getEvent); // Only numeric IDs
router.put('/:id', isAdmin, upload.single('photo'), eventController.updateEvent);
router.delete('/:id', isAdmin, eventController.deleteEvent);

// ======= ERROR HANDLING FOR MULTER ======= //
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message: 'File upload error: ' + error.message
        });
    } else if (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    next();
});

module.exports = router;
