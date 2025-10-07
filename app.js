require('dotenv').config();
require('express-async-errors');

const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

// Security packages
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

// EJS view engine
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

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// ----- Sessions -----
const store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: 'sessions',
});
store.on('error', (error) => console.error('Session store error:', error));

if (!process.env.SESSION_SECRET) {
  console.error('Error: SESSION_SECRET not defined in .env');
  process.exit(1); // Stop server
}

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

app.use(session(sessionParams)); // Must be before flash

// Flash messages after session
app.use(flash());

// Make flash messages available in all views
app.use((req, res, next) => {
  res.locals.errors = req.flash('error') || [];
  res.locals.info = req.flash('info') || [];
  next();
});

// ----- Routes -----

// Login/Register page
app.get('/', (req, res) => {
  res.render('login'); // views/login.ejs
});

// Expenses page (requires session)
app.get('/expenses', authenticateUser, async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.redirect('/');

  const Expense = require('./models/Expense');
  const userExpenses = await Expense.find({ user: userId }).sort({ date: -1 });

  res.render('expenses', { expenses: userExpenses });
});

// API routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/expenses', authenticateUser, expensesRouter);

// Logout route
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.redirect('/expenses');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

// 404 Page
app.use((req, res) => {
  res.status(404).render('404', { url: req.url });
});

// 500 Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('500', { error: err.message });
});

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
