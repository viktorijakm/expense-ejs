const User = require("../models/User");
const parseVErr = require("../util/parseValidationErr");

const registerShow = (req, res) => res.render("login");

const registerDo = async (req, res, next) => {
  const { email, password, password1 } = req.body;
  if (password !== password1) {
    req.flash("error", "Passwords do not match.");
    return res.redirect("/login");
  }
  try {
    await User.create({ email, password });
    req.flash("info", "Registration successful! Please log in.");
    res.redirect("/login");
  } catch (e) {
    if (e.name === "ValidationError") parseVErr(e, req);
    else if (e.name === "MongoServerError" && e.code === 11000)
      req.flash("error", "Email already registered.");
    else return next(e);
    return res.redirect("/login");
  }
};

const logoff = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.log(err);
    res.redirect("/login");
  });
};

const logonShow = (req, res) => {
  if (req.user) return res.redirect("/expenses");
  res.render("login"); 
};

module.exports = { registerShow, registerDo, logoff, logonShow };
