const express = require('express')
const router = express.Router()
const {
  getAllExpenses,
  createExpense,
  getExpense,
  updateExpense,
  deleteExpense
} = require('../controllers/expenseController')

router.route('/').post(createExpense).get(getAllExpenses)
router.route('/:id').get(getExpense).patch(updateExpense).delete(deleteExpense)

module.exports = router
