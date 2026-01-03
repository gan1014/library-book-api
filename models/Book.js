const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Title is required'], 
    trim: true 
  },
  author: { 
    type: String, 
    required: [true, 'Author is required'] 
  },
  category: { 
    type: String, 
    required: [true, 'Category is required'] 
  },
  publishedYear: { 
    type: Number, 
    required: [true, 'Published year is required'],
    min: [1000, 'Year must be at least 1000'],
    max: [new Date().getFullYear(), 'Year cannot be in the future']
  },
  availableCopies: { 
    type: Number, 
    required: [true, 'Available copies is required'],
    min: [0, 'Available copies cannot be negative'], // Schema-level validation
    default: 0
  }
}, { 
  timestamps: true // Adds createdAt and updatedAt
});

module.exports = mongoose.model('Book', bookSchema);