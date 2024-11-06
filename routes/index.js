var express = require("express");
var router = express.Router();
const {
  handleHomePage,
  handleLocation,
  handleBuyUsedCarPage,
  handleSellCarPage,
  handleShowCarPage,
  handleLocationLangLong,
  handleSuggestions,
  handleBookingPage,
  handlePaymentStatusPage,
  handleRazorpayPaymentVerification,
  handleRazorpayPayment,
  handleFreeBookingPage,
  handleContactUsPage,
  handleAboutUsPage,
  handleServiceHistoryDownload
} = require("../src/controllers/mainController");
const { setCityName } = require("../src/middlewares/setCity");
const { setUserName } = require("../src/middlewares/setUserName");
const { isAuthenticated } = require("../src/middlewares/isAuthenticated");


router.use(setCityName);
router.use(setUserName);
router.get("/car-suggestions", handleSuggestions);
router.get("/", handleHomePage);
router.get("/buyusedcar", handleBuyUsedCarPage);
router.route("/locationName").get(handleLocation).post(handleLocation);
router.post("/locationLangLong", handleLocationLangLong);
router.get("/buyusedcar/showcar/:id", handleShowCarPage);
router.get("/sellcar", handleSellCarPage);
router.get(
  "/buyusedcar/showcar/:id/testdrive-:type",
  isAuthenticated,
  handleBookingPage
);
router.get("/freebooking", isAuthenticated, handleFreeBookingPage);
router.get("/contactus",handleContactUsPage)
router.get("/aboutus",handleAboutUsPage)


// Route to handle form submission and create a payment link
router.post("/create-payment", isAuthenticated, handleRazorpayPayment);
router.get(
  "/payment/callback",
  isAuthenticated,
  handleRazorpayPaymentVerification
);
router.get("/paymentstatus", isAuthenticated, handlePaymentStatusPage);

// Route to download PDF by car ID
router.get("/download/pdf/:carId", handleServiceHistoryDownload )


module.exports = router;
