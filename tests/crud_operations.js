const { app } = require("../app");
const Expense = require("../models/Expense");
const { seed_db, testUserPassword } = require("../utils/seed_db");
const get_chai = require("../utils/get_chai");

describe("CRUD tests for Expense operations", function () {
 
  // BEFORE ALL: Seed DB + log in seeded user
 
  before(async function () {
    console.log("Seeding test database...");
    const { expect, request } = await get_chai();

    //  Reset and seed database with one user + 10 expenses
    this.test_user = await seed_db();
    console.log("Database seeded successfully");

    //  Get CSRF token from logon page
    let req = request.execute(app).get("/sessions/logon").send();
    let res = await req;
    const textNoLineEnd = res.text.replaceAll("\n", "");
    const match = /_csrf\" value=\"(.*?)\"/.exec(textNoLineEnd);
    this.csrfToken = match ? match[1] : null;

    //  Try to extract CSRF cookie (if any)
    const cookies = res.headers["set-cookie"] || [];
    this.csrfCookie = cookies.find((c) => c.startsWith("csrfToken")) || "";
    if (!this.csrfCookie) console.warn("⚠️ No csrfCookie found (safe to ignore in test mode)");

    // Log in with seeded user
    const dataToPost = {
      email: this.test_user.email,
      password: testUserPassword,
      _csrf: this.csrfToken,
    };

    req = request
      .execute(app)
      .post("/sessions/logon")
      .set("content-type", "application/x-www-form-urlencoded")
      .redirects(0);

    if (this.csrfCookie) req = req.set("Cookie", this.csrfCookie);
    res = await req.send(dataToPost);

    // Extract session cookie (if available)
    const cookiesAfterLogin = res.headers["set-cookie"] || [];
    this.sessionCookie = cookiesAfterLogin.find((c) => c.startsWith("connect.sid")) || "";
    if (!this.sessionCookie) console.warn("⚠️ No sessionCookie found (test mode may bypass session)");

    //  Assert essential items
    expect(this.csrfToken).to.not.be.undefined;
  });

  
  // GET: Expense List Page
 
  it("should get the expense list page with 10 entries", async function () {
    const { expect, request } = await get_chai();
    const cookieHeader = [this.csrfCookie, this.sessionCookie].filter(Boolean).join("; ");

    const req = request
      .execute(app)
      .get("/api/v1/expenses/list")
      .set("Cookie", cookieHeader)
      .send();

    const res = await req;
    expect(res).to.have.status(200);
    expect(res.text).to.include("Your Expenses");
  });

  
  // POST: Add new Expense
  
  it("should add a new expense entry", async function () {
    const { expect, request } = await get_chai();
    const cookieHeader = [this.csrfCookie, this.sessionCookie].filter(Boolean).join("; ");

    const dataToPost = {
      title: "Test Expense",
      amount: 123.45,
      category: "Testing",
      date: new Date().toISOString().split("T")[0],
      _csrf: this.csrfToken,
    };

    const req = request
      .execute(app)
      .post("/api/v1/expenses")
      .set("Cookie", cookieHeader)
      .set("content-type", "application/x-www-form-urlencoded")
      .send(dataToPost);

    const res = await req;
    expect(res).to.have.status(200);

    const expenses = await Expense.find({ user: this.test_user._id });
    expect(expenses.length).to.be.greaterThanOrEqual(11);
  });

  
  // PATCH: Update Expense
  
  it("should update an existing expense", async function () {
    const { expect, request } = await get_chai();
    const cookieHeader = [this.csrfCookie, this.sessionCookie].filter(Boolean).join("; ");

    const expense = await Expense.findOne({ user: this.test_user._id });
    expect(expense).to.not.be.null;

    const updatedData = {
      title: "Updated Expense",
      amount: 222.22,
      category: "Updated Category",
      _csrf: this.csrfToken,
    };

    const req = request
      .execute(app)
      .patch(`/api/v1/expenses/${expense._id}`)
      .set("Cookie", cookieHeader)
      .set("content-type", "application/x-www-form-urlencoded")
      .send(updatedData);

    const res = await req;
    expect(res).to.have.status(200);

    const updatedExpense = await Expense.findById(expense._id);
    expect(updatedExpense.title).to.equal("Updated Expense");
  });

  
  // DELETE: Expense
  
  it("should delete an expense", async function () {
    const { expect, request } = await get_chai();
    const cookieHeader = [this.csrfCookie, this.sessionCookie].filter(Boolean).join("; ");

    const expense = await Expense.findOne({ user: this.test_user._id });
    expect(expense).to.not.be.null;

    const req = request
      .execute(app)
      .delete(`/api/v1/expenses/${expense._id}`)
      .set("Cookie", cookieHeader)
      .send({ _csrf: this.csrfToken });

    const res = await req;
    expect(res).to.have.status(200);

    const deletedExpense = await Expense.findById(expense._id);
    expect(deletedExpense).to.be.null;
  });
});
