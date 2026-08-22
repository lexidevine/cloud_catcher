const router = require('express').Router();
const { Sighting, User, CloudType } = require('../models');

// Converts compass degrees (0-360) into a directional text (ex: "NE")
function degreesToCompass(deg) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
}

router.get('/', async (req, res) => {
  try {
    // Get all sightings, sorted by time created from newest to oldest
    const sightingData = await Sighting.findAll({
      include: [User, CloudType],
      order: [['logged_at', 'DESC']],
    });

    // Get all users, sorted by name from A to Z
    const userData = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['name', 'ASC']],
    });

    // Get all cloud types, sorted by name from A to Z
    const cloudTypeData = await CloudType.findAll({
      order: [['name', 'ASC']],
    });

    // Serialize sighting data so templates can read it
    const sightings = sightingData.map((sighting) => sighting.get({ plain: true }));

    // Serialize user data so templates can read it
    const users = userData.map((project) => project.get({ plain: true }));

    // Serialize cloud type data so templates can read it
    const cloudTypes = cloudTypeData.map((cloudType) => cloudType.get({ plain: true }));

    // Pass serialized data into Handlebars.js template
    res.render('sightings', { sightings, users, cloudTypes });
  } catch (err) {
    res.status(500).json(err);
  }
});

// CREATE a sighting
router.post('/', async (req, res) => {
  try {
    const { lat, lon } = req.body;
    let weather_snapshot = null;

    // Only attempt a weather lookup if the browser sent coordinates
    if (lat && lon) {
      try {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=imperial`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        weather_snapshot = {
          temp: Math.round(weatherData.main.temp),
          conditions: weatherData.weather[0].description,
          cloud_cover: weatherData.clouds.all,
          humidity: weatherData.main.humidity,
          wind_speed: Math.round(weatherData.wind.speed),
          wind_direction: degreesToCompass(weatherData.wind.deg),
          air_pressure: weatherData.main.pressure,
        };
      } catch (weatherErr) {
        // Weather lookup failing shouldn't block the sighting from being logged
        console.error('Weather lookup failed:', weatherErr.message);
      }
    }

    const newSighting = await Sighting.create({
      user_id: req.body.user_id,
      cloud_type_id: req.body.cloud_type_id,
      location: req.body.location,
      notes: req.body.notes,
      weather_snapshot,
    });

    res.redirect('/sightings');
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
