const { pool } = require('../config/db');

// Get contact page
exports.getContactPage = (req, res) => {
  res.render('contact', {
    title: 'Contact Us',
    user: req.session.user
  });
};

// Handle contact form submission
exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }

    // Save to database
    const result = await pool.query(
      `INSERT INTO contact_messages 
       (name, email, subject, message, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, email, subject, message, 'unread']
    );

    // Send success response
    res.status(201).json({
      success: true,
      message: 'Message sent successfully! We will get back to you soon.',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while sending your message. Please try again.'
    });
  }
};

// Initialize contact_messages table
const initContactTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'unread',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Contact messages table created successfully');
  } catch (error) {
    console.error('Error creating contact messages table:', error);
  }
};

// Initialize table when the controller is loaded
initContactTable(); 