import { setupFilters } from "./filter.js";

// Grab DOM elements
const token = localStorage.getItem("token");
const expenseForm = document.getElementById("expenseForm");
const expensesList = document.getElementById("expensesList");
const responseDiv = document.getElementById("response");
const logoutBtn = document.getElementById("logoutBtn");

// Redirect to login if no token
if (!token) {
  window.location.href = "login.html";
}

// Logout button
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

// Load expenses (optionally filtered)
async function loadExpenses(filters = {}) {
  try {
    let url = "/api/v1/expenses";
    const params = new URLSearchParams();

    if (filters.category) params.append("category", filters.category);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    if ([...params].length > 0) url += `?${params.toString()}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (res.ok) {
      expensesList.innerHTML = "";
      data.expenses.forEach((exp) => {
        const li = document.createElement("li");
        li.textContent = `${exp.title} - $${exp.amount} (${exp.category}) on ${new Date(
          exp.date
        ).toLocaleDateString()}`;
        expensesList.appendChild(li);
      });
    } else {
      responseDiv.textContent = data.msg || "Failed to fetch expenses.";
    }
  } catch (err) {
    console.error(err);
    responseDiv.textContent = "Error loading expenses.";
  }
}

// Add expense
expenseForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const amount = document.getElementById("amount").value;
  const category = document.getElementById("category").value;
  const date = document.getElementById("date").value;

  try {
    const res = await fetch("/api/v1/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, amount, category, date }),
    });

    const data = await res.json();

    if (res.ok) {
      responseDiv.textContent = "Expense added!";
      expenseForm.reset();
      loadExpenses(); // reload expenses
    } else {
      responseDiv.textContent = data.msg || "Failed to add expense.";
    }
  } catch (err) {
    console.error(err);
    responseDiv.textContent = "Error adding expense.";
  }
});

// Setup category/date filters
setupFilters(loadExpenses);

// Initial load
loadExpenses();
