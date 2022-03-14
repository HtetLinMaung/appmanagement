const { Schema, model } = require("mongoose");

const imageSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    tag: {
      type: String,
      default: "latest",
    },
    remote: {
      type: String,
      required: true,
    },
    bt_ref: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model("Image", imageSchema);
