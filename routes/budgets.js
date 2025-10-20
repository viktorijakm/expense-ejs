const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');

// ----- LIST -----
router.get('/', async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.session.userId });
    res.render('budgets', { budgets });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Unable to fetch budgets');
    res.redirect('/expenses');
  }
});

// ----- SHOW ADD FORM -----
router.get('/add', (req, res) => {
  res.render('budgetForm', { budget: {}, action: '/api/v1/budgets/add' });
});

// ----- ADD -----
router.post('/add', async (req, res) => {
  try {
    const { name, limit, period } = req.body;
    await Budget.create({ name, limit, period, user: req.session.userId });
    req.flash('info', 'Budget created successfully');
    res.redirect('/api/v1/budgets');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error creating budget');
    res.redirect('/api/v1/budgets');
  }
});

// ----- SHOW EDIT FORM -----
router.get('/edit/:id', async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.session.userId,
    });
    if (!budget) {
      req.flash('error', 'Budget not found');
      return res.redirect('/api/v1/budgets');
    }
    res.render('budgetForm', {
      budget,
      action: `/api/v1/budgets/edit/${budget._id}`,
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error fetching budget');
    res.redirect('/api/v1/budgets');
  }
});

// ----- EDIT -----
router.post('/edit/:id', async (req, res) => {
  try {
    const { name, limit, period, active } = req.body;
    await Budget.findOneAndUpdate(
      { _id: req.params.id, user: req.session.userId },
      { name, limit, period, active: active === 'on' }
    );
    req.flash('info', 'Budget updated');
    res.redirect('/api/v1/budgets');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error updating budget');
    res.redirect('/api/v1/budgets');
  }
});

// ----- DELETE -----
router.post('/delete/:id', async (req, res) => {
  try {
    await Budget.findOneAndDelete({
      _id: req.params.id,
      user: req.session.userId,
    });
    req.flash('info', 'Budget deleted');
    res.redirect('/api/v1/budgets');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error deleting budget');
    res.redirect('/api/v1/budgets');
  }
});

module.exports = router;
