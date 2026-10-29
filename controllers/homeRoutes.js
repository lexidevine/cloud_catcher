const router = require('express').Router();
const { CloudType, Sighting } = require('../models');

router.get('/', async (req, res) => {
  try {
    // We don't need the actual rows here, just the totals to show off on
    // the homepage, so .count() is lighter than .findAll()
    const cloudTypeCount = await CloudType.count();
    const sightingCount = await Sighting.count();

    // isHome tells the nav bar (main.handlebars) to highlight "Home" as active
    res.render('homepage', { cloudTypeCount, sightingCount, isHome: true });
  } catch (err) {
    res.status(500).json(err);
  }
});

// Show the login/signup page
router.get('/login', (req, res) => {
  // Already logged in? No need for the login page, send them home
  if (req.session.logged_in) {
    res.redirect('/');
    return;
  }

  // isLogin tells the nav bar (main.handlebars) to highlight "Log in" as active
  res.render('login', { isLogin: true });
});

module.exports = router;
