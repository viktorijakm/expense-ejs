// summary.js
export const updateSummary = (expenses) => {
  const summaryDiv = document.getElementById("summary");
  if (!summaryDiv) return;

  // Total amount
  const total = expenses.reduce((acc, exp) => acc + parseFloat(exp.amount), 0);

  // Monthly summary
  const monthly = {};
  expenses.forEach((exp) => {
    const month = new Date(exp.date).toLocaleString("default", { month: "long", year: "numeric" });
    monthly[month] = (monthly[month] || 0) + parseFloat(exp.amount);
  });

  // Render summary
  let html = `<p>Total: $${total.toFixed(2)}</p>`;
  html += "<ul>";
  for (const month in monthly) {
    html += `<li>${month}: $${monthly[month].toFixed(2)}</li>`;
  }
  html += "</ul>";

  summaryDiv.innerHTML = html;
};
