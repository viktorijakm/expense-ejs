const loginForm = document.getElementById("loginForm");
const responseDiv = document.getElementById("response");

// Redirect to expenses page if already logged in
const token = localStorage.getItem("token");
if (token) {
  window.location.href = "expenses.html";
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      responseDiv.textContent = "Login successful! Redirecting...";
      setTimeout(() => {
        window.location.href = "expenses.html";
      }, 1000);
    } else {
      responseDiv.textContent = data.msg || "Failed to login.";
    }
  } catch (err) {
    console.error(err);
    responseDiv.textContent = "Error logging in.";
  }
});
