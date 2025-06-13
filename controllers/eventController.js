const { pool } = require('../config/db');
const path = require('path');
const fs = require('fs').promises;

// Get user events page
exports.getUserEventsPage = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM events 
            WHERE event_date >= CURRENT_DATE 
            ORDER BY event_date ASC
        `);

        res.render('userevents', {
            user: req.session.user,
            events: result.rows || [],
            title: 'Upcoming Events'
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.render('userevents', {
            user: req.session.user,
            events: [],
            title: 'Upcoming Events'
        });
    }
};

// Get events page
exports.getEventsPage = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM events 
            ORDER BY event_date DESC
        `);

        res.render('events', {
            user: req.session.user,
            events: result.rows || [],
            title: 'Events Management',
            error: null,
            success: null
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.render('events', {
            user: req.session.user,
            events: [],
            title: 'Events Management',
            error: 'Error loading events: ' + error.message,
            success: null
        });
    }
};

// Create new event
exports.createEvent = async (req, res) => {
    try {
        const { title, description, event_date, location, type } = req.body;
        let photo_url = null;

        // Handle photo upload if exists
        if (req.file) {
            const uploadDir = path.join(__dirname, '../public/uploads/events');
            await fs.mkdir(uploadDir, { recursive: true });
            
            const fileName = `event-${Date.now()}${path.extname(req.file.originalname)}`;
            await fs.writeFile(path.join(uploadDir, fileName), req.file.buffer);
            photo_url = `/uploads/events/${fileName}`;
        }

        const result = await pool.query(`
            INSERT INTO events (title, description, event_date, location, type, photo_url, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [title, description, event_date, location, type, photo_url, req.session.user.id]);

        res.json({
            success: true,
            message: 'Event created successfully',
            event: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating event: ' + error.message
        });
    }
};

// Update event
exports.updateEvent = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID'
            });
        }

        const { title, description, event_date, location, type } = req.body;
        let photo_url = null;

        // Handle photo upload if exists
        if (req.file) {
            const uploadDir = path.join(__dirname, '../public/uploads/events');
            await fs.mkdir(uploadDir, { recursive: true });
            
            const fileName = `event-${Date.now()}${path.extname(req.file.originalname)}`;
            await fs.writeFile(path.join(uploadDir, fileName), req.file.buffer);
            photo_url = `/uploads/events/${fileName}`;

            // Delete old photo if exists
            const oldEvent = await pool.query('SELECT photo_url FROM events WHERE id = $1', [id]);
            if (oldEvent.rows[0]?.photo_url) {
                const oldPhotoPath = path.join(__dirname, '../public', oldEvent.rows[0].photo_url);
                await fs.unlink(oldPhotoPath).catch(() => {});
            }
        }

        const updateQuery = photo_url 
            ? `UPDATE events SET title = $1, description = $2, event_date = $3, location = $4, type = $5, photo_url = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *`
            : `UPDATE events SET title = $1, description = $2, event_date = $3, location = $4, type = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *`;
        
        const values = photo_url 
            ? [title, description, event_date, location, type, photo_url, id]
            : [title, description, event_date, location, type, id];

        const result = await pool.query(updateQuery, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        res.json({
            success: true,
            message: 'Event updated successfully',
            event: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating event: ' + error.message
        });
    }
};

// Delete event
exports.deleteEvent = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID'
            });
        }

        // Get event photo URL before deletion
        const event = await pool.query('SELECT photo_url FROM events WHERE id = $1', [id]);
        
        // Delete event from database
        const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Delete event photo if exists
        if (event.rows[0]?.photo_url) {
            const photoPath = path.join(__dirname, '../public', event.rows[0].photo_url);
            await fs.unlink(photoPath).catch(() => {});
        }

        res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting event: ' + error.message
        });
    }
};

// Get single event
exports.getEvent = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID'
            });
        }

        const result = await pool.query('SELECT * FROM events WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        res.json({
            success: true,
            event: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching event: ' + error.message
        });
    }
}; 