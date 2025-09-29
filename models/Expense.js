const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Please provide title"] },
    amount: { type: Number, required: [true, "Please provide amount"] },
    category: { type: String, required: [true, "Please provide category"] },
    date: { type: Date, required: [true, "Please provide date"] },
    user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", ExpenseSchema);
