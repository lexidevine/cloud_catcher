const router = require('express').Router();
const { Sighting, User, CloudType } = require('../models');
const withAuth = require('../utils/auth');
const { uploadPhoto, cleanPhoto, isPhotoSafe, uploadToCloudinary, deleteFromCloudinary } = require('../utils/upload'); 

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

    // Get all cloud types, sorted by name from A to Z
    const cloudTypeData = await CloudType.findAll({
      order: [['name', 'ASC']],
    });

    // Who is looking at the page, and are they the admin?
    const userId = req.session.user_id;
    const isAdmin = userId === Number(process.env.ADMIN_USER_ID);

    // Serialize sighting data, and mark which catches this person can delete
    const sightings = sightingData.map((sighting) => {
      const plainSighting = sighting.get({ plain: true });
      plainSighting.canDelete = plainSighting.user_id === userId || isAdmin;
      return plainSighting;
    });

    // Serialize cloud type data so templates can read it
    const cloudTypes = cloudTypeData.map((cloudType) => cloudType.get({ plain: true }));

    //Read the note, then throwi taway so it only shows once
    const uploadError = req.session.uploadError;
    delete req.session.uploadError;

    res.render('sightings', { sightings, cloudTypes, uploadError });
  } catch (err) {
    res.status(500).json(err);
  }
});

// CREATE a sighting
router.post('/', withAuth, uploadPhoto, async (req, res) => {
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

    let image_url = null;

    //Only upload if the person added a photo
    if (req.file) {
      const cleanedPhoto = await cleanPhoto(req.file.buffer);
      const photoIsSafe = await isPhotoSafe(cleanedPhoto);

      if (!photoIsSafe) {
        req.session.uploadError = 'Uh oh, that photo is a little too stormy for Cloud Catcher! Please pick another.';

        req.session.save(() => {
          res.redirect('/sightings');
        });
        return;
      }

      image_url = await uploadToCloudinary(cleanedPhoto);
    }

    const newSighting = await Sighting.create({
      user_id: req.session.user_id,
      cloud_type_id: req.body.cloud_type_id,
      location: req.body.location,
      notes: req.body.notes,
      image_url,
      weather_snapshot,
    });

    res.redirect('/sightings');
  } catch (err) {
    console.log(err);
    req.session.uploadError = 'Oopsie! Something went wrong logging your catch. Please try again.';

    req.session.save(() => {
      res.redirect('/sightings');
    });
  }
});

//DELETE a Sighting
router.post('/:id/delete', withAuth, async (req, res) => {
  try {
    const sighting = await Sighting.findByPk(req.params.id);
    // If the catch doesn't exist, go back to Catches
    if (!sighting) {
      res.redirect('/sightings');
      return;
    }

    const isOwner = sighting.user_id === req.session.user_id;
    const isAdmin = req.session.user_id === Number(process.env.ADMIN_USER_ID);

    // Stop if it's not your catch and you're not the admin
    if (!isOwner && !isAdmin) {
      req.session.uploadError = "Hey, that's not your cloud to let go!";
      req.session.save(() => {
        res.redirect('/sightings');
      });
      return;
    }

    // Remove the photo from Cloudinary first, if there is one
    if (sighting.image_url) {
      await deleteFromCloudinary(sighting.image_url);
    }

    await sighting.destroy();

    res.redirect('/sightings');
  } catch (err) {
    console.log(err);
    req.session.uploadError = 'Oopsie! That catch floated away before we could delete it. Please try again.';
    req.session.save(() => {
      res.redirect('/sightings');
    });
  }
});

module.exports = router;
