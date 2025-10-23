const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Budget name is required'],
    minlength: [3, 'Budget name must be at least 3 characters long'],
  },
  limit: {
    type: Number,
    required: [true, 'Budget limit is required'],
    min: [0, 'Limit must be positive'],
  },
  period: {
    type: String,
    enum: ['weekly', 'monthly', 'yearly'],
    required: [true, 'Period must be weekly, monthly, or yearly'],
  },
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

module.exports = mongoose.model('Budget', BudgetSchema);
