const { Schema, model } = require("mongoose");

const appSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    compose_version: {
      type: String,
      default: "3.9",
    },
    services: [
      {
        name: {
          type: String,
          required: true,
          unique: true,
        },
        image: {
          type: String,
          required: true,
        },
        ports: [String],
        environment: [String],
        volumes: [String],
      },
    ],
    volumes: [String],
  },
  {
    timestamps: true,
  }
);

module.exports = model("Application", appSchema);
