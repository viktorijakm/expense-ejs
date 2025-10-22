const express = require('express')
const router = express.Router()
const Expense = require('../models/Expense');
const {
  getAllExpenses,
  createExpense,
  getExpense,
  updateExpense,
  deleteExpense
} = require('../controllers/expenseController')

router.route('/').post(createExpense).get(getAllExpenses)
router.route('/:id').get(getExpense).patch(updateExpense).delete(deleteExpense)

// Show Add Expense form
router.get('/add', (req, res) => {
  res.render('expenseForm', { 
    expense: null, 
    _csrf: res.locals._csrf, 
    action: '/api/v1/expenses' 
  });
});

// Show Add Expense form
router.get('/add', (req, res) => {
  res.render('expenseForm', { 
    expense: null, 
    _csrf: res.locals._csrf, 
    action: '/api/v1/expenses' 
  });
});

// Show Edit Expense form
router.get('/edit/:id', async (req, res) => {
  try {
    const expense = await Expense.findOne({ 
      _id: req.params.id, 
      user: req.user.userId 
    });

    if (!expense) {
      req.flash('error', 'Expense not found.');
      return res.redirect('/expenses');
    }

    res.render('expenseForm', { 
      expense, 
      _csrf: res.locals._csrf, 
      action: `/api/v1/expenses/${expense._id}?_method=PATCH` 
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error loading expense.');
    res.redirect('/expenses');
  }
});

module.exports = router;