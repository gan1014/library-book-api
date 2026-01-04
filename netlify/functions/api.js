const express = require("express");
const serverless = require("serverless-http");

const { connectDB } = require("../../config/database");
const { Book, VALID_CATEGORIES } = require("../../models/bookModel");

const app = express();
app.use(express.json());

const router = express.Router();
app.use("/.netlify/functions/api", router);

// Connect DB before any route
router.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    return res.status(500).json({ error: "Database connection failed", details: err.message });
  }
});

// Health check
router.get("/health", (req, res) => res.json({ ok: true }));

// CREATE
router.post("/books", async (req, res) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ all
router.get("/books", async (req, res) => {
  const books = await Book.find({}).sort({ title: 1 });
  res.json(books);
});

// READ by category
router.get("/books/category/:category", async (req, res) => {
  const { category } = req.params;
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: "Invalid category", validCategories: VALID_CATEGORIES });
  }
  const books = await Book.find({ category });
  res.json(books);
});

// READ after year
router.get("/books/after/:year", async (req, res) => {
  const year = Number(req.params.year);
  if (!Number.isInteger(year)) return res.status(400).json({ error: "Year must be an integer" });

  const books = await Book.find({ publishedYear: { $gt: year } }).sort({ publishedYear: -1 });
  res.json(books);
});

// UPDATE copies (+/-) with negative stock prevention
router.patch("/books/:id/copies", async (req, res) => {
  try {
    const { change } = req.body;
    if (!Number.isInteger(change)) return res.status(400).json({ error: "change must be an integer" });

    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ error: "Book not found" });

    const newCopies = book.availableCopies + change;
    if (newCopies < 0) {
      return res.status(400).json({
        error: "Negative stock not allowed",
        currentCopies: book.availableCopies,
        requestedChange: change,
      });
    }

    book.availableCopies = newCopies;
    await book.save();
    res.json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UPDATE category
router.patch("/books/:id/category", async (req, res) => {
  try {
    const { category } = req.body;
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: "Invalid category", validCategories: VALID_CATEGORIES });
    }

    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { category },
      { new: true, runValidators: true }
    );

    if (!book) return res.status(404).json({ error: "Book not found" });
    res.json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE only if availableCopies = 0
router.delete("/books/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ error: "Book not found" });

    if (book.availableCopies !== 0) {
      return res.status(400).json({
        error: "Cannot delete unless availableCopies = 0",
        availableCopies: book.availableCopies,
      });
    }

    await Book.findByIdAndDelete(req.params.id);
    res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports.handler = serverless(app);