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

// LOGIN as a user
router.post('/login', async (req, res) => {
  try {
    const userData = await User.findOne({
      where: {
        email: req.body.email,
      },
    });

    if (!userData) {
      res
        .status(400)
        .json({ message: 'Incorrect email or password. Please try again!' });
      return;
    }

    const validPassword = await userData.checkPassword(req.body.password);

    if (!validPassword) {
      res
        .status(400)
        .json({ message: 'Incorrect email or password. Please try again!' });
      return;
    }

    // Stores the user's ID in their session (server side)
    req.session.user_id = userData.id;
    req.session.logged_in = true;

    // Saves cookie, THEN sends the user to the homepage
    req.session.save(() => {
      res.redirect('/');
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// LOGOUT the user
router.post('/logout', (req, res) => {
  // When the user logs out, destroy the session
  if (req.session.logged_in) {
    req.session.destroy(() => {
      res.redirect('/');
    });
  } else {
    res.redirect('/');
  }
});

module.exports = router;
