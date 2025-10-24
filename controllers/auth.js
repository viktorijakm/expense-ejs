const User = require("../models/User");
const bcrypt = require("bcryptjs");
const passport = require("passport");

// Registration
const register = async (req, res) => {
  try {
    const { email, password, password1 } = req.body;
    if (!email || !password || !password1) {
      req.flash("error", "Please fill in all fields.");
      return res.redirect("/");
    }

    if (password !== password1) {
      req.flash("error", "Passwords do not match.");
      return res.redirect("/");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash("error", "Email already registered.");
      return res.redirect("/");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword });

    // Optionally store session info
    req.session.userId = user._id;
    req.session.email = user.email;

    req.flash("info", "Registration successful! Please log in.");
    res.redirect("/");
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong.");
    res.redirect("/");
  }
};

// Login handled by Passport
const login = (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/expenses",
    failureRedirect: "/",
    failureFlash: true,
  })(req, res, next);
};

module.exports = { register, login };
