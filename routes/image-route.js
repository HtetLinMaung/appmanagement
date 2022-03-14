const express = require("express");
const path = require("path");
const fs = require("fs");

const Image = require("../models/Image");
const BuildTemplate = require("../models/BuildTemplate");

const simpleGit = require("simple-git");
const git = simpleGit().clean(simpleGit.CleanOptions.FORCE);

const { dockerCommand } = require("docker-cli-js");
const { buildImage } = require("../utils/image-builder");

const codesFolder = path.join(__dirname, "..", "storage", "codes");

const router = express.Router();

router
  .route("/")
  .post(async (req, res) => {
    try {
      const { name, tag, remote, bt_ref } = req.body;

      let image = await Image.findOne({ name, tag });

      if (image) {
        return res.json({
          code: 400,
          message: "Image already exists",
        });
      }

      const buildTemplate = await BuildTemplate.findOne({ ref: bt_ref });
      if (!buildTemplate) {
        return res.status(404).json({
          code: 404,
          message: "Build template not found",
        });
      }

      const projectPath = path.join(codesFolder, `${name}_${tag}`);

      await git.clone(remote, projectPath);

      fs.writeFileSync(
        path.join(projectPath, "Dockerfile"),
        buildTemplate.steps.join("\n\n")
      );

      image = new Image({ name, tag, remote, bt_ref });
      await image.save();

      await buildImage(image);

      res.status(201).json({
        code: 201,
        message: "Image created successfully",
        data: image,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ code: 500, message: "Internal Server Error" });
    }
  })
  .get(async (req, res) => {
    try {
      const images = await Image.find();
      res.json({
        code: 200,
        message: "Images retrieved successfully",
        data: images,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ code: 500, message: "Internal Server Error" });
    }
  });

const updateRoute = async (req, res) => {
  try {
    const user = req.params.user;
    const { ref } = req.params;
    const image = await Image.findOne({ ref: user ? user + "/" + ref : ref });
    if (!image) {
      return res.status(404).json({
        code: 404,
        message: "Image not found",
      });
    }

    const { remote, bt_ref } = req.body;
    const buildTemplate = await BuildTemplate.findOne({ ref: bt_ref });
    if (!buildTemplate) {
      return res.status(404).json({
        code: 404,
        message: "Build template not found",
      });
    }

    const projectPath = path.join(codesFolder, `${image.name}_${image.tag}`);
    if (fs.existsSync(projectPath)) {
      fs.rmSync(projectPath, { recursive: true });
    }
    await git.clone(remote, projectPath);

    image.remote = remote;
    image.bt_ref = bt_ref;
    await image.save();
    await buildImage(image);
    res.json({
      code: 200,
      message: "Image updated successfully",
      data: image,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: "Internal Server Error" });
  }
};

const deleteRoute = async (req, res) => {
  try {
    const user = req.params.user;
    const { ref } = req.params;
    const image = await Image.findOne({ ref: user ? user + "/" + ref : ref });
    if (!image) {
      return res.status(404).json({
        code: 404,
        message: "Image not found",
      });
    }

    try {
      await dockerCommand(`image rm ${image.name}:${image.tag}`);
    } catch (e) {
      console.log(e);
    }

    const projectPath = path.join(codesFolder, `${image.name}_${image.tag}`);
    if (fs.existsSync(projectPath)) {
      fs.rmdirSync(projectPath, { recursive: true });
    }
    await image.remove();

    res.json({
      code: 200,
      message: "Image deleted successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: "Internal Server Error" });
  }
};

const getByRefRoute = async (req, res) => {
  try {
    const user = req.params.user;
    const { ref } = req.params;
    const image = await Image.findOne({ ref: user ? user + "/" + ref : ref });
    res.json({
      code: 200,
      message: "Image retrieved successfully",
      data: image,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: "Internal Server Error" });
  }
};

router.route("/:ref").get(getByRefRoute).put(updateRoute).delete(deleteRoute);
router
  .route("/:user/:ref")
  .get(getByRefRoute)
  .put(updateRoute)
  .delete(deleteRoute);

const buildRoute = async (req, res) => {
  try {
    const user = req.params.user;

    const [name, tag] = req.params.ref.split(":");
    const image = await Image.findOne({
      name: user ? user + "/" + name : name,
      tag,
    });
    if (!image) {
      return res.status(404).json({
        code: 404,
        message: "Image not found",
      });
    }
    await buildImage(image);
    res.json({
      code: 200,
      message: "Image build successfully",
      data: image,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: "Internal Server Error" });
  }
};

const pushRoute = async (req, res) => {
  try {
    const user = req.params.user;
    const docker_user = req.query.docker_user;
    const docker_password = req.query.docker_password;

    const [name, tag] = req.params.ref.split(":");
    const image = await Image.findOne({
      name: user ? user + "/" + name : name,
      tag,
    });
    if (!image) {
      return res.status(404).json({
        code: 404,
        message: "Image not found",
      });
    }
    await dockerCommand(`login -u ${docker_user} -p ${docker_password}`);
    await dockerCommand(`push ${image.name}:${image.tag}`);
    res.json({
      code: 200,
      message: "Image pushed successfully",
      data: image,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: "Internal Server Error" });
  }
};

router.get("/:user/:ref/build", buildRoute);

router.get("/:ref/build", buildRoute);

router.get("/:user/:ref/push", pushRoute);

router.get("/:ref/push", pushRoute);

module.exports = router;
