function isAuthenticated(req, res, next) {
    // Check if user is authenticated via session or cookies
    if (req.isAuthenticated() || req.cookies.uid) {
        return next();
    }

    // Flash an error message and redirect to a login page
    req.flash("error", "Please login.");
    res.redirect(req.get('Referrer') || '/'); // Redirect to login page or another appropriate route
}

function isAdminAuthenticated(req,res,next){
    if(req.session && req.session.adminId){
        return  next();
    }
    req.flash("error", "Page not found");
    res.redirect(req.get('Referrer') || '/'); // Redirect to login page or another appropriate route
   
}


module.exports = {
    isAuthenticated,isAdminAuthenticated
};
