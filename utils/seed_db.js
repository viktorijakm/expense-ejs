const Expense = require("../models/Expense");
const User = require("../models/User");
const FactoryBot = require("factory-bot");
require("dotenv").config();

// Dynamically import faker (ESM only now) 
let faker;
(async () => {
  faker = (await import("@faker-js/faker")).fakerEN_US;
})();

// Set up factory bot 
const testUserPassword = "test1234"; // fixed password for consistent tests
const factory = FactoryBot.factory;
const factoryAdapter = new FactoryBot.MongooseAdapter();
factory.setAdapter(factoryAdapter);

// Expense factory
factory.define("expense", Expense, {
  title: () => faker?.commerce.productName() || "Sample Item",
  amount: () => faker?.number.float({ min: 5, max: 500 }) || 99.99,
  category: () => faker?.commerce.department() || "Misc",
  date: () => faker?.date.recent() || new Date(),
});

// User factory 
factory.define("user", User, {
  name: () => faker?.person.fullName() || "John Doe",
  email: () => faker?.internet.email() || "test@example.com",
  password: () => faker?.internet.password() || "secret123",
});

// Function to clear and seed database 
const seed_db = async () => {
  let testUser = null;
  try {
    console.log("Seeding test database...");
    const mongoURL = process.env.MONGO_URI_TEST;

    await Expense.deleteMany({});
    await User.deleteMany({});

    testUser = await factory.create("user", { password: testUserPassword });
    await factory.createMany("expense", 10, { user: testUser._id });

    console.log("Database seeded successfully");
  } catch (e) {
    console.error("Database error:", e.message);
    throw e;
  }
  return testUser;
};

module.exports = { testUserPassword, factory, seed_db };
