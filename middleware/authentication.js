const { UnauthenticatedError } = require('../errors');

const authenticateUser = (req, res, next) => {
  if (!req.session.userId) {
    // If user is not logged in, redirect to login page
    req.flash('error', 'You must be logged in to view this page.');
    return res.redirect('/');
  }
  // User is authenticated
  next();
};

module.exports = authenticateUser;
