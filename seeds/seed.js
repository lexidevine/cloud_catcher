const sequelize = require("../config/connection");
const { User, CloudType, Sighting } = require("../models");

const userData = require("./userData.json");
const cloudTypeData = require("./cloudTypeData.json");
const sightingData = require("./sightingData.json");

const seedDatabase = async () => {
  await sequelize.sync({ force: true });

  await User.bulkCreate(userData, {
    individualHooks: true,
    returning: true,
  });
   await CloudType.bulkCreate(cloudTypeData, {
    individualHooks: true,
    returning: true,
  });
   await Sighting.bulkCreate(sightingData, {
    individualHooks: true,
    returning: true,
  });

  process.exit(0);
};

seedDatabase();
