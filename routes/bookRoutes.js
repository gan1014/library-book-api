const express = require('express');
const router = express.Router();
const Book = require('../models/Book');

// Helper wrapper for async error handling
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 1️⃣ INSERT BOOK (POST /books)
router.post('/', asyncHandler(async (req, res) => {
  const book = new Book(req.body);
  await book.save();
  res.status(201).json({ 
    message: 'Book created successfully', 
    book 
  });
}));

// 2️⃣ READ ALL BOOKS (GET /books)
router.get('/', asyncHandler(async (req, res) => {
  const books = await Book.find();
  res.json(books);
}));

// 2️⃣ READ BOOKS BY CATEGORY (GET /books/category/Fiction)
router.get('/category/:category', asyncHandler(async (req, res) => {
  const books = await Book.find({ category: req.params.category });
  
  if (books.length === 0) {
    return res.status(404).json({ 
      message: `No books found in category: ${req.params.category}` 
    });
  }
  
  res.json(books);
}));

// 2️⃣ READ BOOKS AFTER YEAR 2015 (GET /books/published-after/2015)
router.get('/published-after/:year', asyncHandler(async (req, res) => {
  const year = parseInt(req.params.year);
  const books = await Book.find({ 
    publishedYear: { $gt: year } // $gt means "greater than"
  });
  res.json(books);
}));

// 3️⃣ UPDATE: INCREASE/DECREASE COPIES (PATCH /books/:id/copies)
router.patch('/:id/copies', asyncHandler(async (req, res) => {
  const { action, amount } = req.body; // action: 'increment' or 'decrement', amount: number
  
  const book = await Book.findById(req.params.id);
  
  // Error: Book not found
  if (!book) {
    const error = new Error('Book not found');
    error.statusCode = 404;
    throw error;
  }
  
  if (action === 'increment') {
    book.availableCopies += amount;
  } else if (action === 'decrement') {
    // Error: Negative stock prevention
    if (book.availableCopies - amount < 0) {
      const error = new Error(
        `Cannot decrease ${amount} copies. Only ${book.availableCopies} available. (Negative stock prevention)`
      );
      error.statusCode = 400; // Bad request
      throw error;
    }
    book.availableCopies -= amount;
  } else {
    // Error: Invalid update
    const error = new Error('Invalid action. Use "increment" or "decrement"');
    error.statusCode = 400;
    throw error;
  }
  
  await book.save();
  res.json({ 
    message: `Copies ${action}ed successfully`, 
    book 
  });
}));

// 3️⃣ UPDATE: CHANGE CATEGORY (PATCH /books/:id/category)
router.patch('/:id/category', asyncHandler(async (req, res) => {
  const { category } = req.body;
  
  const book = await Book.findByIdAndUpdate(
    req.params.id,
    { category },
    { new: true, runValidators: true } // Return updated doc & validate
  );
  
  if (!book) {
    const error = new Error('Book not found');
    error.statusCode = 404;
    throw error;
  }
  
  res.json({ message: 'Category updated', book });
}));

// 4️⃣ DELETE: REMOVE BOOK ONLY IF COPIES = 0 (DELETE /books/:id)
router.delete('/:id', asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  
  // Error: Book not found
  if (!book) {
    const error = new Error('Book not found');
    error.statusCode = 404;
    throw error;
  }
  
  // Condition: Only delete if copies = 0
  if (book.availableCopies !== 0) {
    const error = new Error(
      `Cannot delete book. It has ${book.availableCopies} copies available. Must have 0 copies to delete.`
    );
    error.statusCode = 400;
    throw error;
  }
  
  await Book.findByIdAndDelete(req.params.id);
  res.json({ 
    message: 'Book deleted successfully (had 0 copies)', 
    deletedBook: book 
  });
}));

module.exports = router;