// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Admin authorization middleware
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.redirect('/login');
};

// Request logging middleware
const logRequest = (req, res, next) => {
    console.log(`${req.method} ${req.path}`, {
        session: req.session,
        user: req.session.user
    });
    next();
};

module.exports = {
    isAuthenticated,
    isAdmin,
    logRequest
}; 