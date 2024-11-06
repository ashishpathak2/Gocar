const user = require("../models/userModel");
const {generateToken, verifyToken} = require("../utils/generateJwtToken")


async function setUserName(req, res, next) {
    if (req.cookies && req.cookies.uid) {
        try {
            const data = verifyToken(req.cookies.uid);
            const TokenUser = await user.findOne({ _id: data.id }).select("-password");
            
            if (TokenUser) {
                res.locals.User = TokenUser.name;
                return next(); // Only proceed if user is found
            }
        } catch (error) {
            console.error("Error verifying token or finding user:", error);
        }
    }
    if ( req.session.passport && req.session.passport.user.name) {
        res.locals.User = req.session.passport.user.name;
        return next();
    }

    // If no valid token or user is found, redirect to home
    res.locals.User = ""
    next();
}

module.exports = {
    setUserName
}