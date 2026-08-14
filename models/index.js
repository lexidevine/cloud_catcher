const User = require("./User");
const CloudType = require("./CloudType");
const Sighting = require("./Sighting");

User.hasMany(Sighting, { foreignKey: "user_id" });
Sighting.belongsTo(User, {foreignKey: "user_id" });

CloudType.hasMany(Sighting, { foreignKey: "cloud_type_id" });
Sighting.belongsTo(CloudType, {foreignKey: "cloud_type_id" });

module.exports = { User, CloudType, Sighting };

