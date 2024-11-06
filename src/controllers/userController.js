const user = require("../models/userModel");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/generateJwtToken");
const product = require("../models/productModel");
const otpGenerator = require("otp-generator");
var nodemailer = require("nodemailer");
const admin = require("../models/adminModel")

async function handleSignup(req, res) {
  // Basic input validation
  if (!req.body.email || !req.body.password || !req.body.name) {
    req.flash("error", "Email, password, and name are required");
    return res.redirect(req.get('Referrer') || '/');;
  }

  try {
    // Check if the email already exists
    const userExists = await user.findOne({ email: req.body.email }).exec();
    if (userExists) {
      req.flash("error", "Email already exists");
      return res.redirect(req.get('Referrer') || '/');;
    }

    // Hash the password
    const hash = await bcrypt.hash(req.body.password, 12);

    // Create a new user instance
    const newUser = new user({
      name: req.body.name,
      email: req.body.email,
      username: req.body.username, // Optional: Include if required
      password: hash,
    });
    
  // const newadmin = new admin({
  //   "name":req.body.name ,
  //   "email":req.body.email ,
  //   "role":"Manager",
  //   "isAdmin" :true,
  //   "password": hash,
  // });
  // await newadmin.save() 

    // Save the new user to the database
    await newUser.save();

    // Generate JWT token after successful save
    const jwtToken = generateToken(newUser);

    // Set JWT token as a cookie
    res.cookie("uid", jwtToken, {
      httpOnly: true, // Mitigate XSS attacks
      // secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      // sameSite: "strict", // Mitigate CSRF attacks
    });

    // Flash a success message
    req.flash("success_msg", "Signup Successful");

    // Store the user's ID in the session
    req.session.localUserId = newUser._id;

    // Redirect to a specific route (e.g., the home page or login page)
    res.redirect(req.get('Referrer') || '/');; // Adjust as needed
  } catch (error) {
    // Log error and flash a generic message
    console.error("Error during user registration:", error);
    req.flash("error", "Something went wrong. Please try again.");
    res.redirect(req.get('Referrer') || '/');;
  }
}

async function handleLogin(req, res) {
  try {
    // Validate request body
    if (!req.body.email || !req.body.password) {
      req.flash("error", "Email and password are required");
      return res.redirect(req.get('Referrer') || '/');;
    }

    // Check if the user is trying to login as an admin
    if (req.body.email === "ashish@gmail.com") {
      const adminUser = await admin.findOne({ email: req.body.email });
      
      if (adminUser && adminUser.isAdmin) { // Ensure admin is found and is an admin
        const isMatch = await bcrypt.compare(req.body.password, adminUser.password);
        
        if (isMatch) {
          req.session.adminId = adminUser._id;
          req.session.cookie.maxAge = 30 * 60 * 1000; // Set session to expire in 30 minutes

          return res.redirect("/admin");
        } else {
          req.flash("error", "Something went wrong");
          return res.redirect(req.get('Referrer') || '/');;
        }
      } else {
        req.flash("error", "Something went wrong");
        return res.redirect(req.get('Referrer') || '/');;
      }
    }

    // Handle normal user login
    const foundUser = await user.findOne({ email: req.body.email }).select('+password').exec();
    
    if (!foundUser) {
      req.flash("error", "Invalid email or password");
      return res.redirect(req.get('Referrer') || '/');;
    }

    // Compare passwords using bcrypt
    const isMatch = await bcrypt.compare(req.body.password, foundUser.password);
    if (!isMatch) {
      req.flash("error", "Invalid email or password");
      return res.redirect(req.get('Referrer') || '/');;
    }

    // Generate JWT token
    const jwtToken = generateToken(foundUser); // Assumes generateToken is defined elsewhere

    // Set JWT token in cookie
    res.cookie("uid", jwtToken, {
      httpOnly: true, // Mitigate XSS attacks
      // secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      // sameSite: "strict", // Mitigate CSRF attacks
    });

    // Flash success message and set session
    req.flash("success_msg", "Welcome back");
    req.session.localUserId = foundUser._id;

    // Redirect user
    res.redirect(req.get('Referrer') || '/');;
  } catch (error) {
    console.error("Login error:", error); // Log error for debugging
    req.flash("error", "Something went wrong");
    res.redirect(req.get('Referrer') || '/');;
  }
}


function uriRedirect(req, res) {
  req.flash("success_msg", "Login Successful");
  res.redirect("/");
}

async function handleLogout(req, res, next) {
  try {
    // Clear the user cookie with security attributes
    res.clearCookie("uid", {
      httpOnly: true, // Mitigate XSS attacks
      // secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      // sameSite: "strict", // Mitigate CSRF attacks
    });

    // Log out the user using Passport's logout method
    req.logout(function (err) {
      if (err) {
        return next(err); // Pass the error to the error-handling middleware
      }

      // Redirect to the home page or a known safe route
      res.redirect("/");
    });
  } catch (error) {
    next(error); // Handle any unexpected errors
  }
}

async function handleForgetPasswordPage(req, res) {
  try {
    // Render the forget password page
    res.render("forgetpassword", {
      activePage: "forgetpassword", // Highlight the forget password page in navigation
      showOtp: false, // Do not show OTP input initially
      hide: false, // Ensure email input is visible initially
    });
  } catch (error) {
    console.error("Error rendering forget password page:", error);
    // Flash an error message to the user
    req.flash(
      "error",
      "An error occurred while loading the page. Please try again."
    );
    // Redirect to a fallback page or render an error page
    res.redirect("/"); // Adjust to your error handling route
  }
}

async function handleForgetPassword(req, res) {
  try {
    // Validate email input
    const { email } = req.body;
    if (!email) {
      req.flash("error", "Email is required.");
      return res.redirect(req.get('Referrer') || '/');;
    }

    // Find the user by email
    const foundUser = await user.findOne({ email }).exec();
    if (!foundUser) {
      req.flash("error", "Invalid Email.");
      return res.redirect(req.get('Referrer') || '/');;
    }

    // Generate OTP and set it in the session
    req.session.passwordResetUser = foundUser;
    req.session.OTP = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      digits: true,
    });

    // Create the nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GOCAR_EMAIL, // Your email
        pass: process.env.GOCAR_APP_PASSWORD // App-specific password
      },
    });

    // Set mail options
    const mailOptions = {
      from:process.env.GOCAR_EMAIL, // Sender's email
      to: email,
      subject: "Password Recovery Mail from Gocar",
      text: `OTP for password recovery: ${req.session.OTP}`,
    };

    // Send the email with the OTP
    await transporter.sendMail(mailOptions);

    // Flash success message and render OTP input page
    req.flash("success_msg", "OTP sent to your email successfully.");
    return res.render("forgetpassword", {
      activePage: "forgetpassword",
      showOtp: true,
      hide: false,
    });
  } catch (error) {
    // General error handling
    console.error("Error in handleForgetPassword:", error);
    req.flash("error", "Internal Server Error.");
    return res.redirect(req.get('Referrer') || '/');;
  }
}

function handleOtpVerification(req, res) {
  try {
    // Validate OTP input
    const { otp } = req.body;
    if (!otp) {
      req.flash("error", "OTP is required.");
      return res.redirect(req.get('Referrer') || '/');;
    }

    // Check if the OTP matches the one in the session
    if (req.session.OTP === otp) {
      // Clear the OTP from the session after successful verification
      delete req.session.OTP;

      req.flash("success_msg", "OTP Verified");
      return res.render("forgetpassword", {
        activePage: "forgetpassword",
        showOtp: false, // Hide OTP input form
        hide: true, // Show password reset form
      });
    } else {
      req.flash("error", "Invalid OTP");
      return res.redirect(req.get('Referrer') || '/');;
    }
  } catch (error) {
    // Log and handle unexpected errors
    console.error("Error in handleOtpVerification:", error);
    req.flash("error", "Internal Server Error.");
    return res.redirect(req.get('Referrer') || '/');;
  }
}

async function handleResetPassword(req, res) {
  try {
    // Ensure the password reset session exists
    if (!req.session.passwordResetUser) {
      req.flash(
        "error",
        "Session expired. Please try resetting your password again."
      );
      return res.redirect("/users/forgetpassword");
    }

    // Validate new password input
    const { password } = req.body;
    if (!password || password.length < 8) {
      req.flash(
        "error",
        "Password is required and must be at least 8 characters long."
      );
      return res.redirect("/users/forgetpassword");
    }

    // Find the user in the database
    const passwordResetUser = await user
      .findOne({ email: req.session.passwordResetUser.email })
      .exec();
    if (!passwordResetUser) {
      req.flash("error", "User not found. Please try again.");
      return res.redirect("/users/forgetpassword");
    }

    // Hash the new password
    const hash = await bcrypt.hash(password, 12);

    // Update the user's password
    passwordResetUser.password = hash;
    await passwordResetUser.save();

    // Clear the session after successful reset
    req.session.passwordResetUser = null;
    req.session.OTP = null;

    req.flash("success_msg", "Your password has been successfully reset.");
    return res.redirect("/");
  } catch (error) {
    console.error("Error in handleResetPassword:", error);
    req.flash(
      "error",
      "An error occurred while resetting your password. Please try again."
    );
    return res.redirect("/users/forgetpassword");
  }
}

async function handleMyBookingsPage(req, res) {
  try {
   
    // Find the logged-in user, excluding sensitive fields
    const loggedInUser = await user
      .findById(req.session.localUserId || req.session.passport.user._id)
      .select("-password -email -name -_id")
      .exec();

    if (!loggedInUser) {
      req.flash("error", "User not found.");
      return res.redirect(req.get('Referrer') || '/');;
    }

    const currentDate = new Date().toISOString().split("T")[0];

    // Fetch booked car details
    const bookedCars = await Promise.all(
      loggedInUser.BookingDetails.map(async (booking) => {
        try {
          // Fetch car details, excluding sensitive fields
          const carDetail = await product
            .findById(booking.carId)
            .select(
              "-carParkedAt -createdAt -updatedAt -carDftDetail"
            )
            .exec();

          if (!carDetail) {
            console.error(`Car detail not found for carId: ${booking.carId}`);
            return {
              ...booking,
              carDetail: null,
              status: "Car Detail Not Found",
            };
          }

          // Determine booking status
          const status = currentDate > booking.date ? "Expired" : "Confirmed";

          return {
            ...booking,
            carDetail,
            status, // Adding the status to each booking
          };
        } catch (error) {
          console.error(
            `Error fetching car details for bookingId: ${booking._id}`,
            error
          );
          return {
            ...booking,
            carDetail: null,
            status: "Error Fetching Car Details",
          };
        }
      })
    );

    // Render the page with bookings and car details
    res.render("mybookings", { bookedCars, activePage: "mybookings" });
  } catch (error) {
    console.error("Error handling my bookings page:", error);
    req.flash(
      "error",
      "An error occurred while processing your bookings. Please try again."
    );
    res.redirect(req.get('Referrer') || '/');; // Redirect to the previous page in case of an error
  }
}

async function addToWishlist(req, res) {
  try {
    // Validate carId input
    const { carId } = req.body;
    if (!carId) {
      req.flash("error", "Something went wrong.");
      return res.redirect(req.get('Referrer') || '/');;
    }

    // Find the logged-in user
    const loggedInUser = await user
      .findById(req.session.localUserId || req.session.passport.user._id)
      .select("-password -email -name")
      .exec();

    // Check if the car is already in the wishlist
    if (loggedInUser.wishlistedCar.includes(carId)) {
      req.flash("error", "Car is already in your wishlist.");
      return res.redirect(req.get('Referrer') || '/');;
    }

    // Add car to wishlist
    loggedInUser.wishlistedCar.push(carId);
    await loggedInUser.save();

    req.flash("success_msg", "Added to wishlist");
    res.redirect(req.get('Referrer') || '/');;
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    req.flash(
      "error",
      "An error occurred while adding to wishlist. Please try again."
    );
    res.redirect(req.get('Referrer') || '/');;
  }
}

async function removeFromWishlist(req, res) {
  try {
    // Validate carId input
    const { carId } = req.body;
    if (!carId) {
      req.flash("error", "Something went wrong");
      return res.redirect(req.get('Referrer') || '/');;
    }

    // Find the logged-in user
    const loggedInUser = await user
      .findById(req.session.localUserId || req.session.passport.user._id)
      .select("-password -email -name")
      .exec();

    // Remove car from wishlist
    const index = loggedInUser.wishlistedCar.indexOf(carId);
    if (index !== -1) {
      loggedInUser.wishlistedCar.splice(index, 1); // Remove 1 item at the found index
      await loggedInUser.save();
      req.flash("success_msg", "Removed from wishlist");
    } else {
      req.flash("error", "Car not found in wishlist");
    }

    res.redirect(req.get('Referrer') || '/');;
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    req.flash(
      "error",
      "An error occurred while removing the car from wishlist."
    );
    res.redirect(req.get('Referrer') || '/');;
  }
}

async function handleMyWishlistPage(req, res) {
  try {
    // Find the logged-in user
    const loggedInUser = await user
      .findById(req.session.localUserId || req.session.passport.user._id)
      .select("-password -email -name -_id")
      .exec();

    // Fetch wishlisted car details
    const wishlistedCars = await product
      .find({
        _id: { $in: loggedInUser.wishlistedCar },
      })
      .select("-carParkedAt -createdAt -updatedAt")
      .exec();

    // Render the wishlist page
    res.render("mywishlist", { activePage: "mywishlist", wishlistedCars });
  } catch (error) {
    console.error("Error handling my wishlist page:", error);
    req.flash(
      "error",
      "An error occurred while retrieving your wishlist. Please try again."
    );
    res.redirect(req.get('Referrer') || '/');; // Redirect to the previous page in case of an error
  }
}

module.exports = {
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
};
