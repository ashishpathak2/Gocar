// const mongoose = require('mongoose');
// const plm = require('passport-local-mongoose');

// // Define the schema
// const userSchema = new mongoose.Schema({
//   googleID: { type: String, default: null }, // For Google OAuth users
//   name: { type: String, required: function () { return !this.googleID; } }, // Required if not using Google OAuth
//   email: { type: String, required: true, unique: true }, // Email is required for both types of users
//   password: { type: String, required: function () { return !this.googleID; } }, // Password is required for custom users, not Google OAuth
//   wishlistedCar: [String], // Array for storing wishlisted car IDs
//   BookingDetails: [ // Array for storing booking details
//     {
//       bookingId: String,
//       carId: String,
//       address: String,
//       date: String,
//       time: String,
//       paymentId: String,
//       orderId: String,
//     }
//   ]
// });

// // Use Passport Local Mongoose for custom user authentication and set email as the username field
// userSchema.plugin(plm, { usernameField: 'email' });

// // Export the model
// module.exports = mongoose.model('user', userSchema);


const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');
const validator = require('validator'); // For input validation

// Define the schema
const userSchema = new mongoose.Schema({
  googleID: {
    type: String,
    default: null
  },
  name: {
    type: String,
    required: function() {
      return !this.googleID; // Required only if Google ID is not present
    },
    trim: true,  // Trim any whitespace
    maxlength: 100 // Limit name length
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: props => `${props.value} is not a valid email!`
    }
  },
  password: {
    type: String,
    required: function() {
      return !this.googleID; // Required only if Google ID is not present
    },
    select: false // Prevents password from being returned in queries
  },
  wishlistedCar: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product' // Referencing the Product model
    }
  ],
  BookingDetails: [
    {
      bookingId: {
        type: String,
        required: true
      },
      carId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      address: {
        type: String,
        trim: true,
        maxlength: 255 // Limit address length
      },
      date: {
        type: Date,
        required: true
      },
      time: {
        type: String,
        required: true
      },
      paymentId: {
        type: String
      },
      orderId: {
        type: String
      }
    }
  ]
},
{
  timestamps: true // Adds createdAt and updatedAt timestamps
});

// Use Passport Local Mongoose for custom user authentication
userSchema.plugin(plm, { usernameField: 'email' });


// Add indexes for performance optimization
userSchema.index({ email: 1 });  // Email index for faster lookups
userSchema.index({ googleID: 1 }); // Google ID index

// Export the model
module.exports = mongoose.model('User', userSchema);
