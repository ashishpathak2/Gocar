const admin = require("../models/adminModel");

async function setAdminName(req, res, next) {
    if (req.session && req.session.adminId) {
        const loggedAdmin = await admin.findOne({ _id: req.session.adminId }).select("-password -isAdmin -_id -email");
        res.locals.admin = loggedAdmin; // Set the logged admin in res.locals
        
        
    } else {
        res.locals.admin = null; // Explicitly set admin to null if not found
    }
    next(); // Always call next() to proceed to the next middleware or route handler
}

module.exports = {
    setAdminName 
};
