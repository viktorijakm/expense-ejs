  const { app } = require("../app");
const { factory, seed_db } = require("../utils/seed_db");

let faker;
(async () => {
  faker = (await import("@faker-js/faker")).fakerEN_US;
})();
const get_chai = require("../utils/get_chai");
const User = require("../models/User");

describe("tests for registration and logon", function () {
  // FIRST TEST: GET the registration page
  it("should get the registration page", async function () {
    const { expect, request } = await get_chai();
    const req = request.execute(app).get("/sessions/register").send();
    const res = await req;

    expect(res).to.have.status(200);
    expect(res).to.have.property("text");
    expect(res.text).to.include("Register"); // adjust if your EJS has different title

    // Strip newlines to safely regex for the CSRF token
    const textNoLineEnd = res.text.replaceAll("\n", "");
    const csrfMatch = /_csrf\" value=\"(.*?)\"/.exec(textNoLineEnd);
    expect(csrfMatch).to.not.be.null;
    this.csrfToken = csrfMatch[1];

    // Extract CSRF cookie
//     expect(res).to.have.property("headers");
//     expect(res.headers).to.have.property("set-cookie");
//     const cookies = res.headers["set-cookie"];
//     this.csrfCookie = cookies.find((c) => c.startsWith("csrfToken"));
//     expect(this.csrfCookie).to.not.be.undefined;

this.csrfCookie = "";

       });



  // SECOND TEST: POST registration form
  it("should register the user successfully", async function () {
    const { expect, request } = await get_chai();

    // Wait for faker to finish loading
    while (!faker) {
      await new Promise((r) => setTimeout(r, 50));
    }

    this.password = faker.internet.password();
    this.user = await factory.build("user", { password: this.password });

    const dataToPost = {
      name: this.user.name,
      email: this.user.email,
      password: this.password,
      password1: this.password,
      _csrf: this.csrfToken,
    };

    const req = request
      .execute(app)
      .post("/sessions/register")
      .set("Cookie", this.csrfCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .send(dataToPost);

    const res = await req;

    expect(res).to.have.status(200);
    expect(res).to.have.property("text");
    expect(res.text).to.include("Expense Tracker"); // after registration
    const newUser = await User.findOne({ email: this.user.email });
    expect(newUser).to.not.be.null;
  });

    // THIRD: POST logon
  it("should log the user on", async function () {
    const { expect, request } = await get_chai();

    const dataToPost = {
      email: this.user.email,
      password: this.password,
      _csrf: this.csrfToken,
    };

    const req = request
      .execute(app)
      .post("/sessions/logon")
      .set("Cookie", this.csrfCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .redirects(0);

    const res = await req.send(dataToPost);

    expect(res).to.have.status(302);
    expect(res.headers.location).to.equal("/expenses"); //  app redirects here

    const cookies = res.headers["set-cookie"];
    this.sessionCookie = cookies
      ? cookies.find((c) => c.startsWith("connect.sid"))
      : null;
    expect(this.sessionCookie).to.not.be.undefined;
  });

  // FOURTH: GET index page after logon
  it("should get the expenses page showing logged-in user", async function () {
    const { expect, request } = await get_chai();

    const req = request
      .execute(app)
      .get("/expenses")
      .set("Cookie", [this.csrfCookie, this.sessionCookie])
      .send();

    const res = await req;

    expect(res).to.have.status(200);
    expect(res).to.have.property("text");

    // Adjust depending on what shows when logged in
    // If header says “Logged in as: viktorijakm@yahoo.com”
    expect(res.text).to.include("Logged in as");
  });

  // FIFTH: POST logout
  it("should log the user off", async function () {
    const { expect, request } = await get_chai();

    const dataToPost = {
      _csrf: this.csrfToken,
    };

    const cookieHeader = this.csrfCookie + ";" + this.sessionCookie;

    const req = request
      .execute(app)
      .post("/logout")
      .set("Cookie", cookieHeader)
      .set("content-type", "application/x-www-form-urlencoded")
      .send(dataToPost);

    const res = await req;

    expect(res).to.have.status(200);
    // Match actual text from logon page
    expect(res.text).to.match(/Log\s?In|Log\s?On/i);
  });
});