const Expense = require("../models/Expense");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");

// Get all expenses (used for API filtering or internal fetch)
const getAllExpenses = async (req, res) => {
  const { category, startDate, endDate } = req.query;
  const userId = req.user?._id || req.session?.userId;

  if (!userId) {
    req.flash("error", "User not authenticated.");
    return res.redirect("/sessions/logon");
  }

  const queryObject = { user: userId };

  // Filter by category (case-insensitive)
  if (category) {
    queryObject.category = { $regex: new RegExp(category, "i") };
  }

  // Filter by date range
  if (startDate || endDate) {
    queryObject.date = {};
    if (startDate) queryObject.date.$gte = new Date(startDate);
    if (endDate) queryObject.date.$lte = new Date(endDate);
  }

  const expenses = await Expense.find(queryObject).sort({ date: -1 });
  res.status(StatusCodes.OK).json({ expenses, count: expenses.length });
};

// Create a new expense (from EJS form submission)
const createExpense = async (req, res) => {
  const userId = req.user?._id || req.session?.userId;

  if (!userId) {
    req.flash("error", "User not authenticated.");
    return res.redirect("/sessions/logon");
  }

  req.body.user = userId;

  // Fix timezone issue — adjust date to local time
  if (req.body.date) {
    const localDate = new Date(req.body.date);
    localDate.setMinutes(
      localDate.getMinutes() + localDate.getTimezoneOffset()
    );
    req.body.date = localDate;
  }

  // Prevent accidental duplicates
  const existingExpense = await Expense.findOne({
    title: req.body.title,
    amount: req.body.amount,
    category: req.body.category,
    date: req.body.date,
    user: userId,
  });

  if (existingExpense) {
    req.flash("info", "This expense already exists!");
    return res.redirect("/expenses");
  }

  await Expense.create(req.body);

  req.flash("info", "Expense added successfully!");
  res.redirect("/expenses");
};

// Get single expense by ID
const getExpense = async (req, res) => {
  const userId = req.user?._id || req.session?.userId;
  const { id: expenseId } = req.params;

  const expense = await Expense.findOne({
    _id: expenseId,
    user: userId,
  });

  if (!expense) throw new NotFoundError(`No expense with id ${expenseId}`);
  res.status(StatusCodes.OK).json({ expense });
};

// Update expense
const updateExpense = async (req, res) => {
  const { id: expenseId } = req.params;
  const userId = req.user?._id || req.session?.userId;

  const expense = await Expense.findOneAndUpdate(
    { _id: expenseId, user: userId },
    req.body,
    { new: true, runValidators: true }
  );

  if (!expense) {
    req.flash("error", `Expense not found.`);
    return res.redirect("/expenses");
  }

  req.flash("info", "Expense updated successfully!");
  res.redirect("/expenses");
};

// Delete expense
const deleteExpense = async (req, res) => {
  const { id: expenseId } = req.params;
  const userId = req.user?._id || req.session?.userId;

  const expense = await Expense.findOneAndDelete({
    _id: expenseId,
    user: userId,
  });

  if (!expense) {
    req.flash("error", "Expense not found.");
    return res.redirect("/expenses");
  }

  req.flash("info", "Expense deleted successfully!");
  res.redirect("/expenses");
};

module.exports = {
  getAllExpenses,
  createExpense,
  getExpense,
  updateExpense,
  deleteExpense,
};
