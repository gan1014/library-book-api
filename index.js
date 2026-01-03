require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bookRoutes = require('./routes/bookRoutes');

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB (libraryDB)'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Routes
app.use('/books', bookRoutes);

// Global Error Handler (handles all errors thrown in routes)
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Handle Mongoose CastError (Invalid ID format like "123" instead of ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid book ID format' });
  }
  
  // Handle Mongoose ValidationError (Schema validation failed)
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation Error', 
      details: err.message 
    });
  }
  
  // Use custom status code if set, otherwise 500
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});