const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  // 1 = already connected
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  return mongoose.connection;
};

module.exports = { connectDB };