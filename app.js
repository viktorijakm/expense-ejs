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

// Passport init
const passportInit = require('./passport/passportInit');

// EJS
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

// ----- Sessions -----
const store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: 'sessions',
});
store.on('error', (error) => console.error('Session store error:', error));

const sessionParams = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
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

// Passport
passportInit();
app.use(passport.initialize());
app.use(passport.session());

// Make user and flash messages available in all views
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.errors = req.flash('error');
  res.locals.info = req.flash('info');
  next();
});

// ----- Routes -----
app.get('/', (req, res) => res.render('login')); // login page

app.get('/expenses', authenticateUser, async (req, res) => {
  const Expense = require('./models/Expense');
  const userExpenses = await Expense.find({ user: req.user._id }).sort({ date: -1 });
  res.render('expenses', { expenses: userExpenses });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/expenses', authenticateUser, expensesRouter);

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.log(err);
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

// 404 and 500
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// Start server
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
