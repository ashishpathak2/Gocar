var express = require('express');
var router = express.Router();
const {handleDashboard,handleProducts,handleBookings,handleMessages,handleCustomer,handleAccount,handleSetting,handleAdminLogout,handleAddProductPage,handleAddProducts,handleDeleteProducts,handleUpdateProducts,handleUpdateProductsPage,handleAllBookingsPage} = require("../src/controllers/adminController");
const {upload} = require("../src/config/multer")
const {isAdminAuthenticated} = require("../src/middlewares/isAuthenticated")
const {setAdminName} = require("../src/adminFunctions/setAdminName")


router.use(setAdminName)
router.get("/",isAdminAuthenticated,handleDashboard)
router.get('/products',isAdminAuthenticated, handleProducts)
router.get('/bookings',isAdminAuthenticated, handleAllBookingsPage)

router.get('/addproducts',isAdminAuthenticated, handleAddProductPage)

router.post("/addproduct", upload.fields([
    { name: 'mainImage', maxCount: 1 },                // Main image (single)
    { name: 'slideImages', maxCount: 15 },             // Slider images (multiple)
    { name: 'serviceReport', maxCount: 1 },            // Service report (single PDF)
    { name: 'imperfectPartImages[]', maxCount: 10 },   // Imperfect part images (multiple)
    { name: 'repairedPartImages[]', maxCount: 10 }    // Repainted part images (multiple)
]), handleAddProducts);

router.get("/deleteproduct/:id",isAdminAuthenticated,handleDeleteProducts)
router.get("/updateproduct/:id",isAdminAuthenticated,handleUpdateProductsPage)

router.post("/updateproduct",isAdminAuthenticated,upload.fields([
    { name: 'mainImage', maxCount: 1 },                // Main image (single)
    { name: 'slideImages', maxCount: 15 },             // Slider images (multiple)
    { name: 'serviceReport', maxCount: 1 },            // Service report (single PDF)
    { name: 'imperfectPartImages[]', maxCount: 10 },   // Imperfect part images (multiple)
    { name: 'repairedPartImages[]', maxCount: 10 }    // Repainted part images (multiple)
]) ,handleUpdateProducts)


router.get('/bookings', isAdminAuthenticated,handleBookings)
router.get('/messages',isAdminAuthenticated, handleMessages)
router.get('/customers',isAdminAuthenticated,handleCustomer)
router.get('/account',isAdminAuthenticated, handleAccount)
router.get('/settings',isAdminAuthenticated,handleSetting)
router.get("/logout", isAdminAuthenticated,handleAdminLogout);











module.exports = router;