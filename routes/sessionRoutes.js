const express = require('express');
const router = express.Router();
const passport = require('passport');
const { registerShow, registerDo, logoff, logonShow } = require('../controllers/sessionController');

router.route('/register').get(registerShow).post(registerDo);

router
  .route('/logon')
  .get(logonShow)
  .post(
    passport.authenticate('local', {
      successRedirect: '/expenses', // your main page
      failureRedirect: '/login', // your login page
      failureFlash: true
    })
  );

router.route('/logoff').post(logoff);

module.exports = router;
