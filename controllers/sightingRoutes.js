const router = require('express').Router();
const { Sighting } = require('../models');

router.get('/', async (req, res) => {
  try {
    // Get all sightings, sorted by time created from newest to oldest
    const sightingData = await Sighting.findAll({
      order: [['logged_at', 'DESC']],
    });

    // Serialize sighting data so templates can read it
    const sightings = sightingData.map((sighting) => sighting.get({ plain: true }));

    // Pass serialized data into Handlebars.js template
    res.render('sightings', { sightings });
  } catch (err) {
    res.status(500).json(err);
  }
});

// CREATE a sighting
router.post('/', async (req, res) => {
  try {
    const newSighting = await Sighting.create({
      user_id: req.body.user_id,
      cloud_type_id: req.body.cloud_type_id,
      location: req.body.location,
      notes: req.body.notes,
    });

    res.redirect('/sightings');
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
