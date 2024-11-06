const product = require("../models/productModel");
const user = require("../models/userModel");


function handleDashboard(req,res){
  res.render("admin/admin_main/dashboard",{activePage:"dashboard"})
}

async function handleProducts(req,res){

  const allProducts = await product.find().select("_id carCompany carName");

  res.render('admin/admin_main/product', { activePage: 'product-list',allProducts });
}

function handleBookings(req,res){
  res.render('admin/admin_main/dashboard', { activePage: 'booking-list' });
}
function handleMessages(req,res){
  res.render('admin/admin_main/dashboard', { activePage: 'messages' });
}

function handleCustomer(req,res){
  res.render('admin/admin_main/dashboard', { activePage: "customers" });
}

function handleAccount(req,res){
  res.render('admin/admin_main/dashboard', { activePage: "account-list" });
}

function handleSetting(req,res){
  res.render('admin/admin_main/dashboard', { activePage: "settings" });
}
function handleAdminLogout(req, res, next) {
  // Clear the admin session ID
  req.session.adminId = null;

  // Destroy the entire session
  req.session.destroy(function (err) {
    if (err) {
      return next(err); // Handle error in session destruction
    }

    // Redirect after the session is successfully destroyed
    res.redirect("/");
  });
}

function handleAddProductPage(req,res) {

  res.render("admin/admin_main/add_products",{activePage:'product-list'})

}


async function handleAddProducts(req, res) {
  const mainScreenCarImageBuffer = req.files && req.files.mainImage ? req.files.mainImage[0].buffer : null;
  const sliderImage = [];
  let serviceHistoryPdf = [];
  const carInspectionReport = {
      imperfections: [],
      repairedParts: []
  };

  // Handle Imperfect Part Names and Images
  const imperfectPartNames = req.body.imperfectPartNames || [];
  const imperfectPartImages = req.files["imperfectPartImages[]"] || [];

  if (imperfectPartNames.length > 0 && imperfectPartImages.length > 0) {
      for (let i = 0; i < imperfectPartNames.length; i++) {
          carInspectionReport.imperfections.push({
              partName: imperfectPartNames[i],
              partImage: imperfectPartImages[i].buffer
          });
      }
  }

  // Handle Repaired Part Names and Images
  const repairedPartNames = req.body.repairedPartNames || [];
  const repairedPartImages = req.files["repairedPartImages[]"] || [];

  if (repairedPartNames.length > 0 && repairedPartImages.length > 0) {
      for (let i = 0; i < repairedPartNames.length; i++) {
          carInspectionReport.repairedParts.push({
              partName: repairedPartNames[i],
              partImage: repairedPartImages[i].buffer
          });
      }
  }

  // Handle Slider Images
  if (req.files && req.files.slideImages) {
      req.files.slideImages.forEach(element => {
          sliderImage.push({
              imageBuffer: element.buffer,
              imageName: element.originalname.split(".")[0]
          });
      });
  }

  // Handle PDF Upload
  const pdfFiles = req.files['serviceReport'] || [];
  if (pdfFiles.length > 0) {
      serviceHistoryPdf = {
          fileName: pdfFiles[0].originalname,
          fileBuffer: pdfFiles[0].buffer,
          contentType: pdfFiles[0].mimetype
      };
  }

  // Create new product
  const newProduct = new product({
      carCompany: req.body.carCompany,
      carName: req.body.carName,
      carImage: mainScreenCarImageBuffer,
      carPrice: req.body.carPrice,
      carMarketPrice: req.body.carMarketPrice,
      city: req.body.carCity,
      carDftDetail: [
          req.body.totaldriven,
          req.body.ownercount,
          req.body.fueltype,
          req.body.transmission
      ],
      carParkedAt: {
          building: req.body.building,
          address: req.body.address,
          googleMapLocationUrl: req.body.googleMapLocationUrl,
          locationManagerPhone: req.body.locationManagerPhone
      },
      sliderImage: sliderImage,
      serviceHistoryPdf: serviceHistoryPdf,
      carInspectionReport: carInspectionReport
  });

  // Save new product and redirect
  try {
      await newProduct.save();
      res.redirect("/admin");
  } catch (error) {
      console.error("Error saving product:", error);
      res.status(500).send("Error occurred while adding product.");
  }
}

async function handleDeleteProducts(req, res) {
  try {
      const vehicleId = req.params.id;

      // Deleting the product by its ID
      const deletedVehicle = await product.findByIdAndDelete(vehicleId);

      // Check if the vehicle was found and deleted
      if (!deletedVehicle) {
          req.flash("error", "Vehicle not found.");
          return res.redirect("/admin/products");
      }

      // Flash success message and redirect
      req.flash("success_msg", "Vehicle deleted successfully.");
      res.redirect("/admin/products");

  } catch (error) {
      // Handle errors and send appropriate message
      req.flash("error", "An error occurred while deleting the vehicle.");
      res.redirect("/admin/products");
  }
}

async function handleUpdateProductsPage(req,res){

  const updateCar = await product.findById(req.params.id).select("+sliderImage.imageBuffer +sliderImage.imageName +carInspectionReport.imperfections.partImage +carInspectionReport.repairedParts.partImage");

  // Check if the vehicle was found 
  if (!updateCar) {
    req.flash("error", "Vehicle not found.");
    return res.redirect("/admin/products");
}

req.session.updateCarId = req.params.id;
res.render("admin/admin_main/update_products",{activePage:'product-list',updateCar})


}

async function handleUpdateProducts(req, res) {
    console.log(req.body);
    console.log(req.files);

    const { 
        arrayOfImperfectionIds = [], 
        deletedRepairedIds = [], 
        imperfectPartNames = [], 
        repairedPartNames = [], 
        totaldriven, 
        ownercount, 
        fueltype, 
        transmission,
        carCompany,
        carName,
        carPrice,
        carMarketPrice,
        carCity,
        building,
        address,
        googleMapLocationUrl,
        locationManagerPhone 
    } = req.body;

    const updateCarId = req.session.updateCarId;
    const updateCar = await product.findById(updateCarId).select(
        "+sliderImage.imageBuffer +sliderImage.imageName +carInspectionReport.imperfections.partImage +carInspectionReport.repairedParts.partImage"
    );

    const sliderImage = [...updateCar.sliderImage]; // Initialize sliderImage with existing images
    const carInspectionReport = {
        imperfections: [...updateCar.carInspectionReport.imperfections],
        repairedParts: [...updateCar.carInspectionReport.repairedParts]
    };

    // Handle Main Image
    const mainScreenCarImageBuffer = req.files?.mainImage?.[0]?.buffer || updateCar.carImage;

    // Filter out deleted imperfections
    carInspectionReport.imperfections = carInspectionReport.imperfections.filter(
        imperfection => !arrayOfImperfectionIds.includes(imperfection._id.toString())
    );

    // Handle Imperfect Part Names and Images
    const imperfectPartImages = req.files["imperfectPartImages[]"] || [];
    imperfectPartNames.forEach((name, index) => {
        if (imperfectPartImages[index]) {
            carInspectionReport.imperfections.push({
                partName: name,
                partImage: imperfectPartImages[index].buffer
            });
        }
    });

    // Filter out deleted repaired parts
    carInspectionReport.repairedParts = carInspectionReport.repairedParts.filter(
        repairedPart => !deletedRepairedIds.includes(repairedPart._id.toString())
    );

    // Handle Repaired Part Names and Images
    const repairedPartImages = req.files["repairedPartImages[]"] || [];
    repairedPartNames.forEach((name, index) => {
        if (repairedPartImages[index]) {
            carInspectionReport.repairedParts.push({
                partName: name,
                partImage: repairedPartImages[index].buffer
            });
        }
    });

    // Handle Slider Images (Append new images if any are uploaded)
    if (req.files?.slideImages) {
        req.files.slideImages.forEach(element => {
            sliderImage.push({
                imageBuffer: element.buffer,
                imageName: element.originalname.split(".")[0]
            });
        });
    }

    // Handle PDF Upload
    const pdfFiles = req.files['serviceReport'] || [];
    const serviceHistoryPdf = pdfFiles.length > 0 
        ? {
            fileName: pdfFiles[0].originalname,
            fileBuffer: pdfFiles[0].buffer,
            contentType: pdfFiles[0].mimetype
        }
        : updateCar.serviceHistoryPdf;

    // Update the car with all collected data
    try {
        Object.assign(updateCar, {
            carCompany,
            carName,
            carImage: mainScreenCarImageBuffer,
            carPrice,
            carMarketPrice,
            city: carCity,
            carDftDetail: [totaldriven, ownercount, fueltype, transmission],
            carParkedAt: {
                building,
                address,
                googleMapLocationUrl,
                locationManagerPhone
            },
            sliderImage,
            serviceHistoryPdf,
            carInspectionReport
        });

        // Save updated product
        await updateCar.save();
        res.redirect("/admin/products");
    } catch (error) {
        console.error("Error saving product:", error);
        res.status(500).send("Error occurred while updating product.");
    }
}


async function handleAllBookingsPage(req,res){

    const users = await user.find({})
    
    // Extract all bookings from users
    const allBookings = [];
    users.forEach(user => {
      user.BookingDetails.forEach(booking => {
        allBookings.push({
          bookingId: booking.bookingId,
          userId: user._id,
          userName: user.name,
          carId: booking.carId,
          address: booking.address,
          date: booking.date,
          time: booking.time,
          paymentId: booking.paymentId,
          orderId: booking.orderId,
          carDetails: booking.carId // This will have the populated car details
        });
      });
    });

    res.render("admin/admin_main/all_bookings" , {activePage:"booking-list" , allBookings})
}


module.exports = {
    handleDashboard,handleProducts,handleBookings,handleMessages,handleCustomer,handleAccount,handleSetting,handleAdminLogout,handleAddProductPage,handleAddProducts,handleDeleteProducts,handleUpdateProducts,handleUpdateProductsPage,handleAllBookingsPage
  }










//   written by ashish for update controller
//   async function handleUpdateProducts(req, res) {

//   const arrayOfdeletedImperfectionIds = req.body.arrayOfImperfectionIds || [];
//   const arrayOfdeletedRepairedIds = req.body.deletedRepairedIds || [];

//   const updateCarId = req.session.updateCarId;
//   const updateCar = await product.findById(updateCarId).select(
//     "+sliderImage.imageBuffer +sliderImage.imageName +carInspectionReport.imperfections.partImage +carInspectionReport.repairedParts.partImage"
//   );

//   let mainScreenCarImageBuffer = {};
//   let serviceHistoryPdf = [];
//   let sliderImage = [...updateCar.sliderImage]; // Initialize sliderImage with existing images
//   let carInspectionReport = {
//       imperfections: [...updateCar.carInspectionReport.imperfections],
//       repairedParts: [...updateCar.carInspectionReport.repairedParts]
//   };

//   // Handle Main Image
//   if (req.files && req.files.mainImage && req.files.mainImage.length > 0) {
//       mainScreenCarImageBuffer = req.files.mainImage[0].buffer;
//   } else {
//       mainScreenCarImageBuffer = updateCar.carImage;
//   }

//   // Pull Imperfection Elements from carInspectionReport
//   if (arrayOfdeletedImperfectionIds.length > 0) {
//       carInspectionReport.imperfections = carInspectionReport.imperfections.filter(
//           imperfection => !arrayOfdeletedImperfectionIds.includes(imperfection._id.toString())
//       );
//   }

//   // Handle Imperfect Part Names and Images
//   const imperfectPartNames = req.body.imperfectPartNames || [];
//   const imperfectPartImages = req.files["imperfectPartImages[]"] || [];

//   if (imperfectPartNames.length > 0 && imperfectPartImages.length > 0) {
//       for (let i = 0; i < imperfectPartNames.length; i++) {
//           carInspectionReport.imperfections.push({
//               partName: imperfectPartNames[i],
//               partImage: imperfectPartImages[i].buffer
//           });
//       }
//   }

//   // Pull Repaired Part Elements from carInspectionReport
//   if (arrayOfdeletedRepairedIds.length > 0) {
//       carInspectionReport.repairedParts = carInspectionReport.repairedParts.filter(
//           repairedPart => !arrayOfdeletedRepairedIds.includes(repairedPart._id.toString())
//       );
//   }

//   // Handle Repaired Part Names and Images
//   const repairedPartNames = req.body.repairedPartNames || [];
//   const repairedPartImages = req.files["repairedPartImages[]"] || [];

//   if (repairedPartNames.length > 0 && repairedPartImages.length > 0) {
//       for (let i = 0; i < repairedPartNames.length; i++) {
//           carInspectionReport.repairedParts.push({
//               partName: repairedPartNames[i],
//               partImage: repairedPartImages[i].buffer
//           });
//       }
//   }

//   // Handle Slider Images (Append new images if any are uploaded)
//   if (req.files && req.files.slideImages && req.files.slideImages.length > 0) {
//       req.files.slideImages.forEach(element => {
//           sliderImage.push({
//               imageBuffer: element.buffer,
//               imageName: element.originalname.split(".")[0]
//           });
//       });
//   }

//   // Handle PDF Upload
//   const pdfFiles = req.files['serviceReport'] || [];
//   if (pdfFiles.length > 0) {
//       serviceHistoryPdf = {
//           fileName: pdfFiles[0].originalname,
//           fileBuffer: pdfFiles[0].buffer,
//           contentType: pdfFiles[0].mimetype
//       };
//   } else {
//       serviceHistoryPdf = {
//           fileName: updateCar.serviceHistoryPdf.fileName,
//           fileBuffer: updateCar.serviceHistoryPdf.fileBuffer,
//           contentType: updateCar.serviceHistoryPdf.contentType
//       };
//   }

//   // Update the car with all collected data
//   try {
//       updateCar.carCompany = req.body.carCompany;
//       updateCar.carName = req.body.carName;
//       updateCar.carImage = mainScreenCarImageBuffer;
//       updateCar.carPrice = req.body.carPrice;
//       updateCar.carMarketPrice = req.body.carMarketPrice;
//       updateCar.city = req.body.carCity;
//       updateCar.carDftDetail = [
//           req.body.totaldriven,
//           req.body.ownercount,
//           req.body.fueltype,
//           req.body.transmission
//       ];
//       updateCar.carParkedAt = {
//           building: req.body.building,
//           address: req.body.address,
//           googleMapLocationUrl: req.body.googleMapLocationUrl,
//           locationManagerPhone: req.body.locationManagerPhone
//       };
//       updateCar.sliderImage = sliderImage;
//       updateCar.serviceHistoryPdf = serviceHistoryPdf;
//       updateCar.carInspectionReport = carInspectionReport;

//       // Save updated product
//       await updateCar.save();
//       res.redirect("/admin/products");
//   } catch (error) {
//       console.error("Error saving product:", error);
//       res.status(500).send("Error occurred while updating product.");
//   }
// }