const router = require('express').Router();
const { User } = require('../models');

// CREATE a new user (sign up)
router.post('/signup', async (req, res) => {
  try {
    // Make the user. User model scrambles the password automatically
    const userData = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });

    // Stores the user's ID in their session (server side)
    req.session.user_id = userData.id;
    req.session.logged_in = true;

    // Saves cookie, THEN sends the user to the homepage
    req.session.save(() => {
      res.redirect('/');
    });
  } catch (err) {
    res.status(400).json(err);
  }
});

module.exports = router;
