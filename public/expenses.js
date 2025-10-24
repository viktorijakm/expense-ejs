import { setupFilters } from "./filter.js";

// Grab DOM elements
const expenseForm = document.getElementById("expenseForm");
const expensesList = document.getElementById("expensesList");
const responseDiv = document.getElementById("response");
const logoutBtn = document.getElementById("logoutBtn");

// Logout button — destroy session on server
logoutBtn.addEventListener("click", async () => {
  try {
    await fetch("/logout", {
      method: "POST",
      credentials: "include", // ensure cookie is sent
    });
    window.location.href = "/sessions/logon";
  } catch (err) {
    console.error(err);
    responseDiv.textContent = "Error logging out.";
  }
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
      credentials: "include", // send session cookie
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
      headers: { "Content-Type": "application/json" },
      credentials: "include", // send cookie so req.user exists
      body: JSON.stringify({ title, amount, category, date }),
    });

    const data = await res.json();

    if (res.ok) {
      responseDiv.textContent = "Expense added!";
      expenseForm.reset();
      loadExpenses(); // reload list
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
