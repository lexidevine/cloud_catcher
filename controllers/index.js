// Imports files
const router = require('express').Router();
const homeRoutes = require('./homeRoutes');
const cloudTypeRoutes = require('./cloudTypeRoutes');
const sightingRoutes = require('./sightingRoutes');
const userRoutes = require('./userRoutes');

// Tells Express to use file at a given path (mounted)
router.use('/', homeRoutes);
router.use('/cloud-types', cloudTypeRoutes);
router.use('/sightings', sightingRoutes);
router.use('/users', userRoutes);

module.exports = router;
