const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/connection");

class Sighting extends Model {
}

Sighting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cloud_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    logged_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    weather_snapshot: {
      type: DataTypes.JSON,
      allowNull: true, // In case API is slow, down, or the fetch fails. This will still log  sighting if the API call fails
    },
  },
  {
    sequelize,
    timestamps: false,
    underscored: true,
    modelName: "sighting",
  },
);

module.exports = Sighting;
