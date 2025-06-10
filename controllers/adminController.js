const User = require('../models/user');
const { pool } = require('../config/db');

// Admin login page
const getLoginPage = (req, res) => {
    res.render('login', { error: null });
};

// Admin login
const login = (req, res) => {
    const { email, password } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (email === adminEmail && password === adminPassword) {
        req.session.user = { email, role: 'admin' };
        return res.redirect('/admin/dashboard');
    }

    res.render('login', { error: 'Invalid credentials' });
};

// Get admin dashboard
const getDashboard = async (req, res) => {
    try {
        // Fetch recent user registrations (last 30 days)
        const recentUsers = await pool.query(`
            SELECT 
                id,
                name,
                email,
                created_at,
                status,
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
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_users,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_users
            FROM users
        `);

        res.render('dashboard', {
            user: req.session.user,
            title: 'Admin Dashboard',
            recentUsers: recentUsers.rows,
            stats: stats.rows[0]
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error loading dashboard' 
        });
    }
};

// Get all users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        res.json({ success: true, users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching users' 
        });
    }
};

// Approve user
const approveUser = async (req, res) => {
    const { userId } = req.params;
    
    try {
        const result = await pool.query(`
            UPDATE users 
            SET is_verified = true 
            WHERE id = $1 
            RETURNING *
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'User approved successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Error approving user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error approving user' 
        });
    }
};

// Reject user
const rejectUser = async (req, res) => {
    const { userId } = req.params;
    
    try {
        const result = await pool.query(`
            DELETE FROM users 
            WHERE id = $1 
            RETURNING *
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'User rejected and removed successfully' 
        });
    } catch (error) {
        console.error('Error rejecting user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error rejecting user' 
        });
    }
};

// Delete user
const deleteUser = async (req, res) => {
    const { userId } = req.params;
    
    try {
        const result = await pool.query(`
            DELETE FROM users 
            WHERE id = $1 
            RETURNING *
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'User deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting user' 
        });
    }
};

module.exports = {
    getLoginPage,
    login,
    getDashboard,
    getAllUsers,
    approveUser,
    rejectUser,
    deleteUser
}; 