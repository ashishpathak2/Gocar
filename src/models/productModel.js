// const mongoose = require('mongoose');


// const productSchema = new mongoose.Schema({
//   carCompany: String,
//   carName: String,
//   carImage:{type:Buffer},
//   sliderImage: [{imageBuffer: Buffer, imageName: String }],  
//   carLocation: String,
//   carPrice: Number,
//   city: String,
//   carParkedAt:{
//     building:String,
//     address:String,
//     googleMapLocationUrl:String,
//     locationManagerPhone:Number,
//   },
//   carDftDetail: { type: Array, default: [] },
// },
//   {
//     timestamps: true 
//   });



//   module.exports = mongoose.model("product", productSchema);


const mongoose = require('mongoose');

// Schema definition
const productSchema = new mongoose.Schema({
  carCompany: {
    type: String,
    required: true,  // Ensures this field is always provided
    trim: true       // Removes leading and trailing whitespace
  },
  carName: {
    type: String,
    required: true,
    trim: true
  },
  carImage: {
    type: Buffer,
    // required: true // Ensures this field is always provided
  },
  sliderImage: [{
    imageBuffer: {
      type: Buffer,
      // required: true,
      select: false // Exclude imageBuffer from query results by default
    },
    imageName: {
      type: String,
      // required: true,
      select: false // Exclude imageName from query results by default
    }
  }],
  // carLocation: {
  //   type: String,
  //   required: true,
  //   trim: true
  // },
  carPrice: {
    type: Number,
    required: true,
    min: 0  // Ensures price is non-negative
  },
  carMarketPrice: {
    type: Number,
    required: true,
    default: 0 ,
    min: 0 // Ensures price is non-negative
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  carParkedAt: {
    building: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    googleMapLocationUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return /^(https?:\/\/)?([a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,6}\/[^\s]+/.test(v);  // Simple URL validation
        },
        message: props => `${props.value} is not a valid URL!`
      }
    },
    locationManagerPhone: {
      type: String,  // Store phone numbers as strings to avoid issues with leading zeros
      validate: {
        validator: function(v) {
          return /^\d{10}$/.test(v);  // Simple phone number validation
        },
        message: props => `${props.value} is not a valid phone number!`
      }
    }
  },
  carInspectionReport:{
    imperfections:[{
      partName:String,
      partImage:{
        type:Buffer,
        select:false,
      }
    }],
    repairedParts:[{
      partName:String,
      partImage:{
        type:Buffer,
        select:false
      }
    }]
  },
  serviceHistoryPdf: {
    fileName: String,
    fileBuffer: Buffer,
    contentType: String
},
  carDftDetail:{
    type: [String], // Specify type if using Array
    default: []
  },
}, {
  timestamps: true
});

// Indexing for performance
productSchema.index({ carCompany: 1 });
productSchema.index({ carLocation: 1 });
productSchema.index({ city: 1 });

// Export the model
module.exports = mongoose.model('Product', productSchema);



  

  // const Product = mongoose.model("product", productSchema);
  

  // const newProduct = new Product({
  //   "carCompany": "Mahaindra",
  //   "carName": "Thar",
  //   "carImage": "https://fastly-production.24c.in/hello-ar/dev/uploads/66ba0672131b6ccb6f80f18f/1d816dcd-e874-4557-8767-3a4edcde9c1f/slot/10135533730-c38ef3861ff148569c2be2fdbc069ec2-Exterior-7.jpg?w=500&auto=format",
  //   "carPrice": 719000,
  //   "city": "New Delhi",
  //   "carDftDetail": [
  //     "12,983",
  //     "PETROL",
  //     "MANUAL"
  //   ]
  // });
  
  // newProduct.save()
  //   .then(product => {
  //     console.log(product); // Check for `createdAt` and `updatedAt` fields
  //   })
  //   .catch(err => console.error(err));


