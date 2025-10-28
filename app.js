require("dotenv").config();
require("express-async-errors");

const express = require("express");
const app = express();

const methodOverride = require("method-override");
app.use(methodOverride("_method"));

const path = require("path");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const passport = require("passport");

// Security
const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss-clean");
const rateLimiter = require("express-rate-limit");

// DB and middleware
const connectDB = require("./db/connect");
const authenticateUser = require("./middleware/authentication");
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

// Flash messages
const flash = require("connect-flash");

// Routers
const authRouter = require("./routes/auth");
const expensesRouter = require("./routes/expenses");
const budgetsRouter = require("./routes/budgets");

// Passport init
const passportInit = require("./passport/passportInit");

// CSRF
const cookieParser = require("cookie-parser");
const { csrfSync } = require("csrf-sync");
const { csrfSynchronisedProtection, generateToken } = csrfSync({
  ignoredMethods: ["GET", "HEAD", "OPTIONS", "POST", "PATCH", "DELETE"], // disables CSRF check for API POSTs (login/register)
});

// EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Security middleware
app.use(helmet());
app.use(cors());
app.use(xss());
app.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Parse cookies FIRST (CSRF depends on this)
app.use(cookieParser(process.env.SESSION_SECRET));

// Initialize sessions
const store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: "sessions",
});
store.on("error", (error) => console.error("Session store error:", error));

const sessionParams = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store,
  cookie: { secure: false, sameSite: "strict" },
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1);
  sessionParams.cookie.secure = true;
}

app.use(session(sessionParams));

// Flash messages
app.use(flash());

// Passport
passportInit();
app.use(passport.initialize());
app.use(passport.session());

// CSRF middleware (with ignored POST methods)
app.use(csrfSynchronisedProtection);

// Generate CSRF token for views
app.use((req, res, next) => {
  res.locals._csrf = generateToken(req);
  res.locals.user = req.user || null;
  res.locals.errors = req.flash("error");
  res.locals.info = req.flash("info");
  next();
});


// Setting Content-Type for HTML and JSON responses 
app.use((req, res, next) => {
  if (req.path === "/multiply") {
    res.set("Content-Type", "application/json");
  } else {
    res.set("Content-Type", "text/html");
  }
  next();
});



// Routes 
app.get("/", (req, res) => {
  if (req.user) return res.redirect("/expenses");
  res.redirect("/sessions/logon");
});

app.use("/sessions", require("./routes/sessionRoutes"));
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/expenses", authenticateUser, expensesRouter);
app.use("/api/v1/budgets", authenticateUser, budgetsRouter);

app.get("/expenses", authenticateUser, async (req, res) => {
  const Expense = require("./models/Expense");
  const userExpenses = await Expense.find({ user: req.user._id }).sort({
    date: -1,
  });
  res.render("expenses", { expenses: userExpenses });
});

app.post("/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy((err) => {
      if (err) console.error(err);
      res.clearCookie("connect.sid");
      res.redirect("/sessions/logon");
    });
  });
});


//  SIMPLE MULTIPLY API (for testing) 
app.get("/multiply", (req, res) => {
  const first = parseFloat(req.query.first);
  const second = parseFloat(req.query.second);
  let result;

  if (isNaN(first) || isNaN(second)) {
    result = "NaN";
  } else {
    result = first * second;
  }

  res.json({ result });
});



// Errors
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// Start server
// const port = process.env.PORT || 3000;

// const start = async () => {
//   try {
//     // Choose correct database depending on environment


    let mongoURL = process.env.MONGO_URI;
    if (process.env.NODE_ENV === "test") {
      mongoURL = process.env.MONGO_URI_TEST;
    }

//     await connectDB(mongoURL);
//     console.log(`Connected to MongoDB (${process.env.NODE_ENV || "development"})`);

//     // Only start listening if not in test mode
//     if (process.env.NODE_ENV !== "test") {
//       app.listen(port, () => console.log(`Server listening on port ${port}...`));
//     }
//   } catch (error) {
//     console.error("Error starting server:", error);
//   }
// };

// start();


const port = process.env.PORT || 3000;
const start = () => {
  try {
    require("./db/connect")(mongoURL);
    return app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();

module.exports = { app };
