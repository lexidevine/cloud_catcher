const router = require('express').Router();
const { CloudType, Sighting } = require('../models');

router.get('/', async (req, res) => {
  try {
    const cloudTypeCount = await CloudType.count();
    const sightingCount = await Sighting.count();

    res.render('homepage', { cloudTypeCount, sightingCount, isHome: true });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
