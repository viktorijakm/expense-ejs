const authenticateUser = (req, res, next) => {
  if (!req.user) {
    req.flash('error', "You can't access that page before logging in.");
    return res.redirect('/');
  }
  next();
};

module.exports = authenticateUser;
