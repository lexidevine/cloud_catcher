const router = require('express').Router();
const { CloudType } = require('../models');

router.get('/', async (req, res) => {
  try {
    // Get all cloud types, sorted by name
    const cloudTypeData = await CloudType.findAll({
      order: [['name', 'ASC']],
    });

    // Serialize cloud type data so templates can read it
    const cloudTypes = cloudTypeData.map((cloudType) => cloudType.get({ plain: true }));

    // Pass serialized data into Handlebars.js template
    res.render('cloud_types', { cloudTypes });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
