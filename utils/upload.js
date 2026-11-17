const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');

// Connects to Cloudinary account using the keys in .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Receives the photo from the form
const upload = multer({
  storage: multer.memoryStorage(), // Hold the photo briefly, don't save it on the server
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    // Only let image files through
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Runs the mailroom, and handles it if a photo gets turned away
const uploadPhoto = (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      req.session.uploadError =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'That cloud is too big! Please choose one under 10 MB.'
          : 'We only catch photos here! Pick a pic to upload.';

      req.session.save(() => {
        res.redirect('/sightings');
      });
      return;
    }

    next();
  });
};

// Removes hidden data like GPS location, and shrinks huge photos
const cleanPhoto = (fileBuffer) => {
  return sharp(fileBuffer)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
};

// Asks Sightengine if a photo is safe to post
const isPhotoSafe = async (fileBuffer) => {
  const form = new FormData();
  form.append('media', new Blob([fileBuffer], { type: 'image/jpeg' }), 'photo.jpg');
  form.append('models', 'nudity-2.1,gore-2.0,violence');
  form.append('api_user', process.env.SIGHTENGINE_API_USER);
  form.append('api_secret', process.env.SIGHTENGINE_API_SECRET);

  const response = await fetch('https://api.sightengine.com/1.0/check.json', {
    method: 'POST',
    body: form,
  });
  const result = await response.json();

  // If the check didn't work, don't assume the photo is safe
  if (result.status !== 'success') {
    throw new Error('Photo check failed');
  }

  const limit = 0.5;

  return (
    result.nudity.sexual_activity < limit &&
    result.nudity.sexual_display < limit &&
    result.nudity.erotica < limit &&
    result.gore.prob < limit &&
    result.violence.prob < limit
  );
};

// Sends the photo to Cloudinary and gives back its web address
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'cloud_catcher',
      },
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(result.secure_url);
      },
    );

    stream.end(fileBuffer);
  });
};

//Removes a photo from Cloudinary using its web address
const deleteFromCloudinary = (imageUrl) => {
  //Turns ".../cloud_catcher/abc123.jpg" into "cloud_catcher/abc123"
  const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];

  return cloudinary.uploader.destroy(publicId);
};

module.exports = { uploadPhoto, cleanPhoto, isPhotoSafe, uploadToCloudinary, deleteFromCloudinary };

