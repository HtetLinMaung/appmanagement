const { Schema, model } = require("mongoose");

const buildTemplateSchema = new Schema(
  {
    ref: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    steps: [String],
  },
  {
    timestamps: true,
  }
);

module.exports = model("BuildTemplate", buildTemplateSchema);
