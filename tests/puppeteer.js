const puppeteer = require("puppeteer");
require("../app");
const { seed_db, testUserPassword } = require("../utils/seed_db");
const Expense = require("../models/Expense");

let testUser = null;
let page = null;
let browser = null;

describe("expense-ejs puppeteer test", function () {
  // Launch the browser and open a page
  before(async function () {
    this.timeout(15000);
    browser = await puppeteer.launch({
      headless: true, // change to false to watch
      slowMo: 100,
    });
    page = await browser.newPage();
    await page.goto("http://localhost:3000");
  });

  // Close browser when done
  after(async function () {
    this.timeout(5000);
    await browser.close();
  });

  // CONNECTIVITY
  describe("site availability", function () {
    it("should connect to the home page", async function () {
      const title = await page.title();
      console.log("Page title:", title);
      if (!title) throw new Error("No page title — site may not have loaded");
    });
  });

  // NAVIGATION
  describe("index page navigation", function () {
    this.timeout(15000);

    it("should go directly to the logon page", async function () {
      await page.goto("http://localhost:3000/sessions/logon");
      await page.waitForSelector('input[name="email"]');
      const url = page.url();
      console.log("Navigated directly to:", url);
    });
  });

  // LOGON FORM
  describe("logon page form", function () {
    this.timeout(30000);

    it("finds all login fields", async function () {
      this.email = await page.waitForSelector('input[name="email"]');
      this.password = await page.waitForSelector('input[name="password"]');
      this.submit = await page.waitForSelector("button[type='submit']");
      console.log(" Found login form fields");
    });



it("submits the login form and verifies the page", async function () {
  this.timeout(35000);
  testUser = await seed_db();

  await this.email.type(testUser.email);
  await this.password.type(testUserPassword);

  // Force timeout resolution if Puppeteer never resolves
  await Promise.race([
    (async () => {
      await Promise.allSettled([
        page.click("button[type='submit']"),
        page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }),
      ]);

      const bodyText = await page.evaluate(() => document.body.innerText);
      if (!bodyText.includes("Expenses") && !bodyText.includes("Expense Tracker")) {
        throw new Error("Login succeeded, but expenses page text not found");
      }

      console.log(" Login verified — page loaded successfully.");

      // Verify user info & logout link
     await page.waitForSelector('form[action="/logout"] button[type="submit"]', { timeout: 8000 });

      const loggedText = await page.$eval("body", (el) => el.innerText);
      console.log("Logged-in page text snippet:", loggedText.slice(0, 200));

      // Optional footer check
      const footer = await page.$("footer");
      if (footer) {
        const footerText = await footer.evaluate((el) => el.textContent);
        console.log("Footer text:", footerText.trim());
      }

      await page.close();
      return true;
    })(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("🕒 Forced end: Puppeteer still hanging")), 20000)
   ),
  ]);
});
  }); 
});  
