const express = require("express");
const BuildTemplate = require("../models/BuildTemplate");

const router = express.Router();

router
  .route("/")
  .post(async (req, res) => {
    try {
      const { name, steps, ref } = req.body;

      const buildTemplate = new BuildTemplate({
        name,
        steps,
        ref,
      });
      await buildTemplate.save();
      res.status(201).json({
        code: 201,
        message: "Build template created successfully",
        data: buildTemplate,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ code: 500, message: "Internal Server Error" });
    }
  })
  .get(async (req, res) => {
    try {
      const buildTemplates = await BuildTemplate.find();
      res.json({
        code: 200,
        message: "Build templates retrieved successfully",
        data: buildTemplates,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ code: 500, message: "Internal Server Error" });
    }
  });

router
  .route("/:ref")
  .get(async (req, res) => {
    try {
      const { ref } = req.params;
      const buildTemplate = await BuildTemplate.findOne({ ref });
      res.json({
        code: 200,
        message: "Build template retrieved successfully",
        data: buildTemplate,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ code: 500, message: "Internal Server Error" });
    }
  })
  .put(async (req, res) => {
    try {
      const { ref } = req.params;
      const { name, steps } = req.body;
      const buildTemplate = await BuildTemplate.findOne({ ref });
      if (!buildTemplate) {
        return res.status(404).json({
          code: 404,
          message: "Build template not found",
        });
      }
      buildTemplate.name = name;
      buildTemplate.steps = steps;
      await buildTemplate.save();
      res.json({
        code: 200,
        message: "Build template updated successfully",
        data: buildTemplate,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ code: 500, message: "Internal Server Error" });
    }
  })
  .delete(async (req, res) => {
    try {
      const { ref } = req.params;
      const buildTemplate = await BuildTemplate.findOne({ ref });
      if (!buildTemplate) {
        return res.status(404).json({
          code: 404,
          message: "Build template not found",
        });
      }
      await buildTemplate.remove();
      res.sendStatus(204);
    } catch (err) {
      console.log(err);
      res.status(500).json({ code: 500, message: "Internal Server Error" });
    }
  });

module.exports = router;
