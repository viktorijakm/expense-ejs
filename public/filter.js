// filter.js
export const setupFilters = (loadExpensesFn) => {
  const categoryInput = document.getElementById("filterCategory");
  const startDateInput = document.getElementById("filterStartDate");
  const endDateInput = document.getElementById("filterEndDate");
  const filterBtn = document.getElementById("applyFilter");

  if (!filterBtn) return; // skip if filters are not in HTML

  filterBtn.addEventListener("click", async () => {
    const filters = {
      category: categoryInput.value || null,
      startDate: startDateInput.value || null,
      endDate: endDateInput.value || null,
    };

    // Call your existing loadExpenses with optional filter parameters
    await loadExpensesFn(filters);
  });
};
