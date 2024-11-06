const mongoose = require('mongoose');


// Define the schema
const adminSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  email: { type: String, required: true, unique: true }, 
  role:{type : String, required:true},
  isAdmin :{ type:Boolean,required:true},
  password: { type: String, required: true },
  
});


// Export the model
module.exports = mongoose.model('admin', adminSchema);


  