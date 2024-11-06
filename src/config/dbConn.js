const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.DATABASE_URL)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process with failure
  });

// Export the connection
module.exports = mongoose.connection;

// Graceful shutdown handling
const gracefulShutdown = async () => {
  try {
    console.log('Closing MongoDB connection...');
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
};

// Handle process termination signals
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Optional: Handle disconnection events and attempt reconnection
mongoose.connection.on('disconnected', () => {
  console.error('MongoDB connection lost. Attempting to reconnect...');
  mongoose.connect(process.env.DATABASE_URL);
});
