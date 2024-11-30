const product = require("../models/productModel");
const user = require("../models/userModel");
const mongoose = require("mongoose");
const { cityNameFromUserLocation } = require("../utils/geolocationGoogle");
const { razorpay } = require("../config/razorpay");
const Fuse = require("fuse.js");
const { v4: uuidv4 } = require("uuid");
const crypto = require('crypto');


const handleSuggestions = async (req, res) => {
  try {
    // Validate and sanitize input
    const searchTerm = (req.query.term || "").trim().toLowerCase();

    // If no search term is provided, return an error response
    if (!searchTerm) {
      return res.status(400).json({ error: "Search term is required." });
    }

    // Validate that the search term is alphanumeric to prevent injection attacks
    if (!/^[a-z0-9\s]+$/.test(searchTerm)) {
      return res.status(400).json({ error: "Invalid search term." });
    }

    // Fetch only the relevant fields from the database and limit the number of documents fetched for better performance
    const allSuggestions = await product
      .find({}, { carCompany: 1, carName: 1 })
      .lean()  // Use lean() for performance, as it returns plain JavaScript objects
      .limit(1000);  // Limit the results to a reasonable number to avoid overloading the server

    // If no suggestions are found, return an empty array
    if (!allSuggestions || allSuggestions.length === 0) {
      return res.json([]);
    }

    // Fuse.js options for fuzzy matching
    const options = {
      keys: ["carCompany", "carName"],
      threshold: 0.3,  // Adjust threshold for desired fuzziness (lower means more precise)
      distance: 100,   // Limits how far a match can be from the search term
      ignoreLocation: true,  // Search regardless of string position
    };

    // Initialize Fuse.js with the fetched suggestions
    const fuse = new Fuse(allSuggestions, options);

    // Perform fuzzy search on the provided search term
    const results = fuse.search(searchTerm).map((result) => result.item);

    // Create a Set to store unique suggestions, ensuring no duplicates
    const uniqueSuggestions = new Set(
      results.map((suggestion) => `${suggestion.carCompany} ${suggestion.carName}`)
    );

    // Return the unique suggestions as an array
    res.json([...uniqueSuggestions]);
  } catch (error) {
    console.error("Error fetching suggestions:", error.message); // Improved error logging
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const handleHomePage = async (req, res) => {
  try {
    // Ensure activePage is explicitly defined
    const activePage = "";

    // Render the homepage and catch rendering errors
    res.render("index", { activePage });
  } catch (error) {
    console.error("Error rendering homepage:", error.message); // Improved error logging
    res.status(500).json({ error: "Internal Server Error" }); // Avoid leaking details to clients
  }
};

const handleLocation = async (req, res) => {
  try {
    // Validate and sanitize inputs
    let locationName = (req.body.locationName || req.query.city || "").trim();
    let page = (req.body.page || req.query.page || "").trim();

    // Basic validation: check if locationName is a string and not too long to prevent attacks
    if (locationName && typeof locationName === "string" && locationName.length > 100) {
      return res.status(400).json({ error: "Location name too long" });
    }

    // Ensure page is a valid relative URL (e.g., avoid open redirects to malicious sites)
    const validPagePattern = /^\/[a-zA-Z0-9/_-]*$/;
    if (!validPagePattern.test(page)) {
      return res.status(400).json({ error: "Invalid page URL" });
    }

    // Save locationName in session if it's valid
    if (locationName.length > 0) {
      req.session.locationName = locationName;
    }

    // Redirect to the valid page
    res.redirect(page || "/"); // Default to homepage if no page is specified
  } catch (error) {
    console.error("Error handling location:", error.message); // Log the error
    res.status(500).json({ error: "Internal Server Error" }); // Send generic error response
  }
};

async function handleLocationLangLong(req, res) {
  const { latitude, longitude } = req.body;

  // Convert latitude and longitude to numbers
  const lat = parseFloat(latitude);
  const long = parseFloat(longitude);

  // Simple manual validation
  const isValidLatitude = (lat) => !isNaN(lat) && lat >= -90 && lat <= 90;
  const isValidLongitude = (long) => !isNaN(long) && long >= -180 && long <= 180;


  if (!isValidLatitude(lat) || !isValidLongitude(long)) {
    console.error('Invalid input:', { latitude, longitude });
    return res.status(400).redirect(req.get('Referrer') || '/');;
  }

  try {
    const city = await cityNameFromUserLocation(res, lat, long);

    // Validate session existence before modifying
    if (req.session) {
      req.session.locationName = city;
    } else {
      return res.status(500).redirect(req.get('Referrer') || '/');;
    }

    res.redirect(req.get('Referrer') || '/');;

  } catch (err) {
    console.error('Error in location handling:', err);
    res.status(500).redirect(req.get('Referrer') || '/');;
  }
}

async function handleBuyUsedCarPage(req, res) {
  let cityName = req.session.locationName || "New Delhi"; // Default to "New Delhi" if no location is provided
  let budget = parseInt(req.query.budget) || 100000; // Default budget to 100000 and ensure it's a number
  let carInfo;
  let showReset = false;
  let count;
  let sortBy = req.query.sortby || "Best Match";
  let userSetBudget = false; // To track if the user set a custom budget
  let sortCriteria = {}; // Sort criteria, default to "Best Match"

  let dbQuery = { city: cityName }; // Initialize dbQuery with city filter

  // Input validation for budget
  if (isNaN(budget) || budget <= 0) {
    console.error("Invalid budget value:", budget);
    req.flash("error", "Something went wrong")
    return res.status(400).redirect(req.get('Referrer') || '/');
  }

  // Input validation for userSetBudget
  if (req.query.userSetBudget === "true" && budget === 200000) {
    userSetBudget = true;
  }

  // Input validation and sanitization for search query
  if (req.query.search) {
    const searchTerms = req.query.search
      .split(" ")
      .map((term) => term.trim().toLowerCase())
      .filter((term) => term); // Remove any empty terms

    if (searchTerms.length > 0) {
      dbQuery.$or = [
        { carCompany: { $regex: searchTerms.join("|"), $options: "i" } },
        { carName: { $regex: searchTerms.join("|"), $options: "i" } },
      ];
    }
  }

  // Budget filtering
  if (userSetBudget || budget !== 100000) {
    dbQuery.carPrice = { $lt: budget }; // Apply budget filter
  }

  // Car brand filtering
  if (req.query.carbrand) {
    const carBrands = Array.isArray(req.query.carbrand)
      ? req.query.carbrand
      : [req.query.carbrand];

    dbQuery.carCompany = { $in: carBrands }; // Match selected brands
  }

  // Sorting based on query parameter
  if (req.query.sortby) {
    if (sortBy === "Recently Added") {
      sortCriteria = { createdAt: -1 }; // Sort by recently added
    } else if (sortBy === "Low To High") {
      sortCriteria = { carPrice: 1 }; // Sort by price, low to high
    } else if (sortBy === "High To Low") {
      sortCriteria = { carPrice: -1 }; // Sort by price, high to low
    }
  }

  try {
    // Fetch car info and document count
    carInfo = await product.find(dbQuery).sort(sortCriteria).limit(50); // Limit results for performance
    count = await product.countDocuments(dbQuery);

    // Show reset option if filters are applied
    showReset =
      Object.keys(dbQuery).length > 1 || Object.keys(sortCriteria).length > 0;

    res.render("buyusedcar", {
      carInfo,
      budget,
      queryParams: req.query,
      showReset,
      cityName,
      count,
      sortBy,
      activePage: "buyusedcar",
    });
  } catch (err) {
    console.error("Error fetching car data:", err);
    req.flash("error", "Something went wrong")
    res.status(500).redirect(req.get('Referrer') || '/');
  }
}

async function handleShowCarPage(req, res) {
  const carId = req.params.id;
  let isWishlistedCar = false; // Default to false if no user is logged in

  // Validate carId is a valid ObjectId
  const ObjectId = mongoose.Types.ObjectId;
  if (!ObjectId.isValid(carId)) {
    req.flash("error", "Something went wrong")
    return res.status(400).redirect(req.get('Referrer') || '/');
  }

  // Check if the user is logged in and has a valid session
  if (req.session && (req.session.localUserId || req.session.passport)) {
    try {
      // Get the user ID from the session
      const userId = req.session.localUserId || req.session.passport.user._id;

      // Fetch user details but exclude sensitive information
      const loggedInUser = await user.findById(userId).select("wishlistedCar");

      if (loggedInUser && loggedInUser.wishlistedCar) {
        // Check if the carId is in the user's wishlisted cars
        isWishlistedCar = loggedInUser.wishlistedCar.includes(carId);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      req.flash("error", "Something went wrong")
      // Set isWishlistedCar to false in case of error
      isWishlistedCar = false;
    }
  }

  try {
    // Fetch the car details from the database
    const car = await product.findById(carId).select("+sliderImage.imageBuffer +sliderImage.imageName +carInspectionReport.imperfections.partImage +carInspectionReport.repairedParts.partImage ");
    const countImperfections = car.carInspectionReport.imperfections.length;
    const countRepairedParts = car.carInspectionReport.repairedParts.length;
    const totalOfferPrice =  car.carMarketPrice - car.carPrice;
    
    if (!car) {
      // If no car is found, send a 404 response

      req.flash("error", "Something went wrong")
      return res.status(404).redirect(req.get('Referrer') || '/');
    }

    // Render the car details page
    res.render("showcar", {
      car,
      carId,
      activePage: "buyusedcar",
      isWishlistedCar,
      countImperfections,
      countRepairedParts,
      totalOfferPrice
       
    });
  } catch (error) {
    console.error("Error fetching car data:", error);
    req.flash("error", "Something went wrong")
    res.status(500).redirect(req.get('Referrer') || '/');
  }
}

function handleSellCarPage(req, res) {
  try {
    // Render the sell car page
    res.render("sellcar", { activePage: "sellcar" });
  } catch (error) {
    console.error("Error rendering sell car page:", error);
    // Send an internal server error status if rendering fails
    req.flash("error", "Something went wrong")
    res.status(500).redirect(req.get('Referrer') || '/');
  }
}

async function handleBookingPage(req, res) {
  try {
    // Ensure the user is logged in by checking session or passport
    const userId = req.session.localUserId || req.session.passport.user._id;

    // Fetch current user details
    const currentUser = await user.findById(userId).select("BookingDetails");

    // Check if the car has already been booked by the user
    const alreadyBooked = currentUser.BookingDetails.some((bookedCar) => {
      return bookedCar.carId.toString() === req.params.id;
    });

    if (alreadyBooked) {
      req.flash("error", "You have already booked this car.");
      return res.redirect(req.get('Referrer') || '/');; // Redirect to the previous page
    }

    // Store the car ID in the session
    req.session.carId = req.params.id;

    // Validate car ID and fetch car details
    const ObjectId = mongoose.Types.ObjectId;
    if (!ObjectId.isValid(req.params.id)) {
      req.flash("error", "Invalid car ID.");
      return res.status(400).redirect(req.get('Referrer') || '/');;
    }

    const carDetail = await product.findById(req.params.id);

    if (!carDetail) {
      req.flash("error", "Something went wrong");
      return res.status(404).redirect(req.get('Referrer') || '/');;
    }

    // Render the booking page
    res.render("bookingpage", {
      activePage: "buyusedcar",
      carDetail,
      BookingType: req.params.type || "standard", // Default to "standard" if type is not provided
    });

  } catch (error) {
    console.error("Error handling booking page:", error);
    req.flash("error", "An error occurred while processing your booking.");
    return res.status(500).redirect(req.get('Referrer') || '/');;
  }
}

async function handleFreeBookingPage(req, res) {
  // Destructure query parameters
  const { address, date, time } = req.query;

  // Generate a unique booking ID
  const bookingId = uuidv4();

  // Create booking information object
  const bookingInfo = {
    bookingId: bookingId,
    address: address,
    date: date,
    time: time,
  };

  try {
    // Fetch car details using the car ID stored in the session
    const carDetail = await product.findById(req.session.carId);

    if (!carDetail) {
      req.flash("error", "Car details not found.");
      return res.status(404).redirect(req.get('Referrer') || '/');;
    }


    const userId = req.session.localUserId || req.session.passport.user._id;
    const currentUser = await user.findById(userId);


    currentUser.BookingDetails.push({
      bookingId: bookingId,
      carId: req.session.carId,
      address: address,
      date: date,
      time: time
    });

    await currentUser.save();


    // Handle booking status as needed
    const bookingstatus = true;

    // Render the free booking page with booking details
    res.render("freebooking", {
      activePage: "buyusedcar",
      bookingstatus,
      carDetail,
      bookingInfo,
    });

  } catch (error) {
    console.error("Error handling free booking page:", error);
    req.flash("error", "An error occurred while processing your booking.");
    return res.status(500).redirect(req.get('Referrer') || '/');;
  }
}

async function handleRazorpayPayment(req, res) {
  // Destructure input data
  const { address, date, time } = req.body;

  // Validate input data
  if (!address || !date || !time) {
    req.flash("error", "Something went wrong")
    return res.status(400).redirect(req.get('Referrer') || '/');
  }

  // Store booking data temporarily in session
  req.session.bookingData = { address, date, time };

  const userId = req.session.localUserId || req.session.passport.user._id;
  const currentUser = await user.findById(userId);

  // Create a payment link
  const paymentLinkOptions = {
    amount: 499 * 100, // Convert to paise (500 INR)
    currency: "INR",
    accept_partial: false,
    description: "Car Booking Payment to Gocar for test-drive at home",
    customer: {
      name: currentUser.name,
      email: currentUser.email
    },
    callback_url: "https://gocars.site/payment/callback", // Use environment variable
    callback_method: "get",
  };

  try {
    const response = await razorpay.paymentLink.create(paymentLinkOptions);

    // Redirect the user to the payment link
    res.redirect(response.short_url);
  } catch (error) {
    console.error("Error creating payment link:", error);
    req.flash("error", "Something went wrong")
    res.status(500).redirect(req.get('Referrer') || '/');
  }
}

async function handleRazorpayPaymentVerification(req, res) {
  const { razorpay_payment_id, razorpay_payment_link_id, razorpay_signature, razorpay_payment_link_status } = req.query;

  if (!razorpay_payment_id || !razorpay_payment_link_id || !razorpay_signature) {
    req.flash("error", "Invalid request parameters.");
    return res.status(400).redirect(req.get('Referrer') || '/');;
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;

  try {

    // const body = razorpay_payment_link_id + "|" + razorpay_payment_id
    // // Generate the signature
    // const generatedSignature = crypto
    //   .createHmac('sha256', secret)
    //   .update(body.toString())
    //   .digest('hex');
    // // Compare signatures
    // // if (generatedSignature === razorpay_signature) {

    if (razorpay_payment_link_status === "paid") {

      if (!req.session.bookingData) {
        req.flash("error", "Something went wrong");
        return res.status(400).redirect(req.get('Referrer') || '/');;
      }

      const userId = req.session.localUserId || req.session.passport.user._id;
      const currentUser = await user.findById(userId);

      // Function to create a short booking ID
      function generateBookingId() {
        const uuid = uuidv4(); // Generate a UUID
        return uuid.split('-')[0]; // Take the first part of the UUID to shorten it
      }
      req.session.randomId = generateBookingId();
      req.session.paymentId = razorpay_payment_id;
      req.session.orderId = razorpay_payment_link_id;


      currentUser.BookingDetails.push({
        bookingId: req.session.randomId,
        carId: req.session.carId,
        address: req.session.bookingData.address,
        date: req.session.bookingData.date,
        time: req.session.bookingData.time,
        paymentId: razorpay_payment_id,
        orderId: razorpay_payment_link_id
      });

      await currentUser.save();
      return res.status(200).redirect("/paymentstatus?status=true");
    } else {
      req.flash("error", "Payment verification failed.");
      return res.status(400).redirect("/paymentstatus?status=false");
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    req.flash("error", "An error occurred while verifying the payment.");
    return res.status(500).redirect(req.get('Referrer') || '/');;
  }
}

async function handlePaymentStatusPage(req, res) {
  const { status } = req.query;

  // Check if bookingData exists and handle accordingly
  const bookingInfo = {
    bookingId: req.session.randomId || "N/A",
    address: (req.session.bookingData && req.session.bookingData.address) || "N/A",
    date: (req.session.bookingData && req.session.bookingData.date) || "N/A",
    time: (req.session.bookingData && req.session.bookingData.time) || "N/A",
    paymentId: req.session.paymentId || "N/A",
    orderId: req.session.orderId || "N/A",
  };

  try {
    const carDetail = await product.findById(req.session.carId);

    // Render the payment status page with booking and car details
    res.render("payment", {
      paymentStatus: status || "unknown", // Default to "unknown" if status is not provided
      carDetail,
      activePage: "payment", // Adjust if you want to highlight the active page in the layout
      bookingInfo,
    });

  } catch (error) {
    console.error("Error fetching car details:", error);
    return res.redirect("/"); // Redirect to a safe default page
  } finally {
    // Clear the session values after rendering the page
    req.session.randomId = null;
    req.session.bookingData = null;
    req.session.paymentId = null;
    req.session.orderId = null;
    req.session.carId = null;
  }
}

function handleContactUsPage(req, res) {
  res.render("contact_us", { activePage: "" })
}

function handleAboutUsPage(req, res) {
  res.render("about_us", { activePage: "" })
}

async function handleServiceHistoryDownload(req, res) {
  const { carId } = req.params;

  try {
      // Fetch the car from MongoDB using the ID
      const car = await product.findById(carId);

      if (!car) {
          return res.status(404).send('Car not found');
      }

      // Check if the car has a valid PDF file for service history
      if (car.serviceHistoryPdf && car.serviceHistoryPdf.fileBuffer && car.serviceHistoryPdf.fileBuffer.length > 0) {
          // Set the response headers to trigger download
          res.set({
              'Content-Type': car.serviceHistoryPdf.contentType || 'application/pdf',  // Ensure content type is set
              'Content-Disposition': `attachment; filename="${car.serviceHistoryPdf.fileName || 'service-history.pdf'}"` // Default filename if not set
          });

          // Send the PDF buffer stored in MongoDB
          return res.send(car.serviceHistoryPdf.fileBuffer);
      } else {
          // Return a 404 response if the PDF file is not found or is invalid
          req.flash("error",'Service history Report not found');
          return res.status(404).redirect(req.get('Referrer') || '/');;
      }
  } catch (error) {
      console.error('Error fetching service history:', error);
      return res.status(500).send('Server error');
  }
}



module.exports = {
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
};
