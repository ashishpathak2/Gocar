var express = require("express");
var router = express.Router();
const {
  handleSignup,
  handleLogin,
  handleLogout,
  uriRedirect,
  handleMyBookingsPage,
  handleMyWishlistPage,
  addToWishlist,
  removeFromWishlist,
  handleForgetPasswordPage,
  handleForgetPassword,
  handleOtpVerification,
  handleResetPassword,
} = require("../src/controllers/userController");
const passport = require("passport");
const { isAuthenticated } = require("../src/middlewares/isAuthenticated");

router.post("/signup", handleSignup);
router.post("/login", handleLogin);
router.get("/logout", handleLogout);
router.get(
  "/auth",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get("/auth/Oauth", passport.authenticate("google"), uriRedirect);
router
  .route("/forgetpassword")
  .get(handleForgetPasswordPage)
  .post(handleForgetPassword);
router.post("/verifyotp", handleOtpVerification);
router.post("/resetpassword", handleResetPassword);

router.get("/mybookings", isAuthenticated, handleMyBookingsPage);
router.post("/addtowishlist", isAuthenticated, addToWishlist);
router.post("/removefromwishlist", isAuthenticated, removeFromWishlist);
router.get("/mywishlist", isAuthenticated, handleMyWishlistPage);

module.exports = router;
