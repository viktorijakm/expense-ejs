const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

const passportInit = () => {
  passport.use(
    new LocalStrategy({ usernameField: 'email', passwordField: 'password' }, async (email, password, done) => {
      try {
        const user = await User.findOne({ email });
        if (!user) return done(null, false, { message: 'Incorrect credentials.' });

        const isMatch = await user.comparePassword(password);
        if (isMatch) return done(null, user);
        return done(null, false, { message: 'Incorrect credentials.' });
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user || false);
    } catch (err) {
      done(err);
    }
  });
};

module.exports = passportInit;
