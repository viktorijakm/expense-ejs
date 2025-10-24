const express = require("express");
const router = express.Router();
const Budget = require("../models/Budget");

// ----- LIST -----
router.get("/", async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.userId; // get correct user
    const budgets = await Budget.find({ user: userId }).sort({ createdAt: -1 });
    res.render("budgets", { budgets });
  } catch (err) {
    console.error(err);
    req.flash("error", "Unable to fetch budgets");
    res.redirect("/expenses");
  }
});
// ----- SHOW ADD FORM -----
router.get("/add", (req, res) => {
  res.render("budgetsForm", { budget: {}, action: "/api/v1/budgets/add" });
});

// ----- ADD -----
router.post("/add", async (req, res) => {
  try {
    const { name, limit, period } = req.body;
    const userId = req.user?._id || req.session?.userId;
    await Budget.create({ name, limit, period, user: userId });
    req.flash("info", "Budget created successfully");
    res.redirect("/api/v1/budgets"); //  correct path
  } catch (err) {
    console.error(err);
    req.flash("error", "Error creating budget");
    res.redirect("/api/v1/budgets"); //  correct path
  }
});

// ----- SHOW EDIT FORM -----
router.get("/edit/:id", async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.userId; //use correct user
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!budget) {
      req.flash("error", "Budget not found");
      return res.redirect("/api/v1/budgets");
    }

    res.render("budgetsForm", {
      budget,
      _csrf: res.locals._csrf,
      action: `/api/v1/budgets/edit/${budget._id}`,
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Error fetching budget");
    res.redirect("/api/v1/budgets");
  }
});

// ----- EDIT -----
router.post("/edit/:id", async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.userId; // correct user
    const { name, limit, period, active } = req.body;

    const updated = await Budget.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { name, limit, period, active: active === "on" },
      { new: true, runValidators: true }
    );

    if (!updated) {
      req.flash("error", "Budget not found or not authorized");
      return res.redirect("/api/v1/budgets");
    }

    req.flash("info", "Budget updated successfully");
    res.redirect("/api/v1/budgets");
  } catch (err) {
    console.error(err);
    req.flash("error", "Error updating budget");
    res.redirect("/api/v1/budgets");
  }
});

// ----- DELETE -----
router.post("/delete/:id", async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.userId; //  use passport user
    const deleted = await Budget.findOneAndDelete({
      _id: req.params.id,
      user: userId,
    });

    if (!deleted) {
      req.flash("error", "Budget not found or not authorized");
      return res.redirect("/api/v1/budgets");
    }

    req.flash("info", "Budget deleted");
    return res.redirect("/api/v1/budgets");
  } catch (err) {
    console.error(err);
    req.flash("error", "Error deleting budget");
    return res.redirect("/api/v1/budgets");
  }
});
module.exports = router;
