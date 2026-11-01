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

module.exports = { uploadPhoto, cleanPhoto, uploadToCloudinary };
