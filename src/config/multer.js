// const multer = require("multer");

// //MemoryStorage 
// const storage = multer.memoryStorage();
// const upload = multer({storage:storage});



//  module.exports={
//     upload
//  }



const multer = require("multer");

// MemoryStorage for storing file buffers in memory
const storage = multer.memoryStorage();

// Configure Multer
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Allowed file types - MIME types for jpeg, png, pdf, and webp
        const allowedTypes = /jpeg|jpg|png|pdf|webp/;
        
        // Test the mimetype of the file
        const extname = allowedTypes.test(file.mimetype);
        
        if (extname) {
            cb(null, true);  // Accept the file
        } else {
            // Reject file with error
            cb(new Error('Invalid file type! Only JPEG, PNG, WebP images and PDFs are allowed.'));
        }
    }
});

module.exports = {
    upload
};


//production style 
//  const multer = require('multer');

// // Memory storage configuration
// const storage = multer.memoryStorage();

// // Define file size limits and allowed file types
// const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
// const ALLOWED_FILE_TYPES = /jpeg|jpg|png|gif/; // Allowed file types

// // Multer file filter function to validate file types
// const fileFilter = (req, file, cb) => {
//   const isFileTypeAllowed = ALLOWED_FILE_TYPES.test(file.mimetype);
//   if (isFileTypeAllowed) {
//     cb(null, true);
//   } else {
//     cb(new Error('Invalid file type'), false);
//   }
// };

// // Multer upload middleware configuration
// const upload = multer({
//   storage,
//   limits: { fileSize: MAX_FILE_SIZE }, // Limit file size
//   fileFilter, // Apply file type validation
// });

// // Export the upload middleware
// module.exports = {
//   upload,
// };
