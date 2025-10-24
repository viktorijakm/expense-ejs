const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const {
  getAllExpenses,
  createExpense,
  getExpense,
  updateExpense,
  deleteExpense,
} = require("../controllers/expenseController");

// ----- ADD EXPENSE FORM -----
router.get("/add", (req, res) => {
  res.render("expenseForm", {
    expense: null,
    _csrf: res.locals._csrf,
    action: "/api/v1/expenses",
  });
});

// ----- EDIT EXPENSE FORM -----
router.get("/edit/:id", async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.userId;
    const expense = await Expense.findOne({ _id: req.params.id, user: userId });

    if (!expense) {
      req.flash("error", "Expense not found.");
      return res.redirect("/expenses");
    }

    res.render("expenseForm", {
      expense,
      _csrf: res.locals._csrf,
      action: `/api/v1/expenses/${expense._id}?_method=PATCH`,
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Error loading expense.");
    res.redirect("/expenses");
  }
});

// ----- LIST EXPENSES PAGE -----
router.get("/list", async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.userId;
    const expenses = await Expense.find({ user: userId }).sort({ date: -1 });

    res.render("expenses", {
      expenses,
      _csrf: res.locals._csrf,
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Error loading expenses.");
    res.redirect("/");
  }
});

// ----- API ROUTES (must come AFTER add/edit!) -----
router.route("/")
  .post(createExpense)
  .get(getAllExpenses);

router.route("/:id")
  .get(getExpense)
  .patch(updateExpense)
  .delete(deleteExpense);

// ----- Redirect /expenses (from app.js) to /list -----
router.get("/", (req, res) => {
  res.redirect("/api/v1/expenses/list");
});

// Handle DELETE form submissions from EJS
router.post("/:id", (req, res, next) => {
  if (req.query._method === "DELETE") {
    req.method = "DELETE";
  }
  next();
});

// ----- Fallback -----
router.use((req, res) => {
  req.flash("error", "Route does not exist");
  res.redirect("/expenses");
});

module.exports = router;
