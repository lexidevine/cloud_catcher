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
    const { lat, lon } = req.body;
    let weather_snapshot = null;

    // Only attempt a weather lookup if the browser sent coordinates
    if (lat && lon) {
      try {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=imperial`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        weather_snapshot = {
          temp: weatherData.main.temp,
          conditions: weatherData.weather[0].description,
          cloud_cover: weatherData.clouds.all,
          humidity: weatherData.main.humidity,
          wind_speed: weatherData.wind.speed,
          wind_degrees: weatherData.wind.deg,
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
