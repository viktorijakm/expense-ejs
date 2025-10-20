require('dotenv').config();
require('express-async-errors');

const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const passport = require('passport');

// Security
const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss-clean');
const rateLimiter = require('express-rate-limit');

// DB and middleware
const connectDB = require('./db/connect');
const authenticateUser = require('./middleware/authentication');
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

// Flash messages
const flash = require('connect-flash');

// Routers
const authRouter = require('./routes/auth');
const expensesRouter = require('./routes/expenses');
const budgetsRouter = require('./routes/budgets');
// const sessionRoutes = require('./routes/sessionRoutes');

// Passport init
const passportInit = require('./passport/passportInit');

const cookieParser = require("cookie-parser");
const { csrfSync } = require("csrf-sync");

const {
  csrfSynchronisedProtection,
  generateToken
} = csrfSync();

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Security middleware
app.use(helmet());
app.use(cors());
app.use(xss());
app.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser(process.env.SESSION_SECRET));

// After body parser but before routes
app.use(csrfSynchronisedProtection);


// ----- Sessions -----
const store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: 'sessions',
});
store.on('error', (error) => console.error('Session store error:', error));

const sessionParams = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store,
  cookie: { secure: false, sameSite: 'strict' },
};

if (app.get('env') === 'production') {
  app.set('trust proxy', 1);
  sessionParams.cookie.secure = true;
}

app.use(session(sessionParams));

// Flash messages
app.use(flash());

// Passport setup
passportInit();
app.use(passport.initialize());
app.use(passport.session());


app.use(csrfSynchronisedProtection);

// Make user and flash messages available in all views
app.use((req, res, next) => {
  res.locals._csrf = generateToken(req);
  res.locals.user = req.user || null;
  res.locals.errors = req.flash("error");
  res.locals.info = req.flash("info");
  next();
});


// ----- Routes -----

// Home route → redirect to login or expenses
app.get('/', (req, res) => {
  if (req.user) return res.redirect('/expenses');
  res.redirect('/sessions/logon');
});

// Session routes (login/register/logout)
app.use('/sessions', require('./routes/sessionRoutes'));

// API routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/expenses', authenticateUser, expensesRouter);
app.use('/api/v1/budgets', authenticateUser, budgetsRouter);

// Expenses page (server-side rendered)
app.get('/expenses', authenticateUser, async (req, res) => {
  const Expense = require('./models/Expense');
  const userExpenses = await Expense.find({ user: req.user._id }).sort({ date: -1 });
  res.render('expenses', { expenses: userExpenses });
});

// Logout route
app.post('/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy((err) => {
      if (err) console.error(err);
      res.clearCookie('connect.sid');
      res.redirect('/sessions/logon');
    });
  });
});

// 404 and error handlers
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// ----- Start server -----
const port = process.env.PORT || 3000;
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    app.listen(port, () => console.log(`Server listening on port ${port}...`));
  } catch (error) {
    console.error('Error starting server:', error);
  }
};

start();
