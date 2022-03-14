const express = require("express");
const Application = require("../models/Application");
const Image = require("../models/Image");
const fs = require("fs");
const path = require("path");
const { dockerCommand } = require("docker-cli-js");
const { buildImage } = require("../utils/image-builder");
const compose = require("docker-compose");

const simpleGit = require("simple-git");

const router = express.Router();

const applicationsFolder = path.join(
  __dirname,
  "..",
  "storage",
  "applications"
);
const codesFolder = path.join(__dirname, "..", "storage", "codes");

// json to docker-compose.yml
const jsonToDockerCompose = (json) => {
  let dockerCompose = `version: "${json.compose_version}"\n\nservices:\n`;
  for (let service of json.services) {
    dockerCompose += `  ${service.name}:\n`;
    dockerCompose += `    image: ${service.image}\n`;
    if (service.ports.length) {
      dockerCompose += `    ports:\n`;
      for (let port of service.ports) {
        dockerCompose += `      - "${port}"\n`;
      }
    }
    if (service.environment.length) {
      dockerCompose += `    environment:\n`;
      for (let env of service.environment) {
        dockerCompose += `      - ${env}\n`;
      }
    }
    if (service.volumes.length) {
      dockerCompose += `    volumes:\n`;
      for (let volume of service.volumes) {
        dockerCompose += `      - ${volume}\n`;
      }
    }
  }
  if (json.volumes.length) {
    dockerCompose += `volumes:\n`;
    for (let volume of json.volumes) {
      dockerCompose += `  ${volume}:\n`;
    }
  }
  return dockerCompose;
};

router
  .route("/")
  .post(async (req, res) => {
    try {
      const { name, compose_version, services, volumes } = req.body;

      const application = new Application({
        name,
        compose_version,
        services,
        volumes,
      });
      await application.save();
      const dockerCompose = jsonToDockerCompose({
        compose_version,
        services,
        volumes,
      });

      if (!fs.existsSync(path.join(applicationsFolder, name))) {
        fs.mkdirSync(path.join(applicationsFolder, name));
      }
      fs.writeFileSync(
        path.join(applicationsFolder, name, "docker-compose.yml"),
        dockerCompose
      );
      res.status(201).json({
        code: 201,
        message: "Application created successfully",
        data: application,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ code: 500, message: "Internal Server Error" });
    }
  })
  .get(async (req, res) => {
    try {
      const applications = await Application.find();
      res.json({
        code: 200,
        message: "Applications retrieved successfully",
        data: applications,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ code: 500, message: "Internal Server Error" });
    }
  });

router
  .route("/:name")
  .get(async (req, res) => {
    try {
      const { name } = req.params;
      const application = await Application.findOne({ name });
      res.json({
        code: 200,
        message: "Application retrieved successfully",
        data: application,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ code: 500, message: "Internal Server Error" });
    }
  })
  .put(async (req, res) => {
    try {
      const { name } = req.params;
      const { compose_version, services, volumes } = req.body;
      const application = await Application.findOne({ name });
      if (!application) {
        return res.status(404).json({
          code: 404,
          message: "Application not found",
        });
      }

      application.compose_version = compose_version;
      application.services = services;
      application.volumes = volumes;
      await application.save();
      const dockerCompose = jsonToDockerCompose({
        compose_version,
        services,
        volumes,
      });
      fs.writeFileSync(
        path.join(applicationsFolder, name, "docker-compose.yml"),
        dockerCompose
      );

      res.json({
        code: 200,
        message: "Application updated successfully",
        data: application,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ code: 500, message: "Internal Server Error" });
    }
  })
  .delete(async (req, res) => {
    try {
      const { name } = req.params;
      const application = await Application.findOne({ name });
      if (!application) {
        return res.status(404).json({
          code: 404,
          message: "Application not found",
        });
      }
      await application.remove();
      fs.rmSync(path.join(applicationsFolder, name), { recursive: true });
      res.sendStatus(204);
    } catch (err) {
      console.log(err);
      res.status(500).json({ code: 500, message: "Internal Server Error" });
    }
  });

router.get("/:name/deploy", async (req, res) => {
  try {
    const { name } = req.params;
    const application = await Application.findOne({ name });
    if (!application) {
      return res.status(404).json({
        code: 404,
        message: "Application not found",
      });
    }

    // docker-compose down
    await compose.down({ cwd: path.join(applicationsFolder, name) });

    for (const service of application.services) {
      const servicearr = service.image.split(":");
      let image = null;
      if (servicearr.length === 2) {
        const [name, tag] = servicearr;
        image = await Image.findOne({ name, tag });
      } else {
        image = await Image.findOne({ name: servicearr[0], tag: "latest" });
      }
      if (image) {
        try {
          await dockerCommand(`image rm ${image.name}:${image.tag}`);
        } catch (e) {
          console.log(e);
        }
        const projectPath = path.join(
          codesFolder,
          `${image.name}_${image.tag}`
        );
        if (!fs.existsSync(projectPath)) {
          await simpleGit().clone(image.remote, projectPath);
        } else {
          await simpleGit(projectPath).pull();
        }

        await buildImage(image);
      }
    }

    await compose.upAll({ cwd: path.join(applicationsFolder, name) });
    res.json({
      code: 200,
      message: "Application deploy successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ code: 500, message: "Internal Server Error" });
  }
});

module.exports = router;
