const { dockerCommand } = require("docker-cli-js");
const path = require("path");

const codesFolder = path.join(__dirname, "..", "storage", "codes");

exports.buildImage = async (image) => {
  const { name, tag } = image;
  return await dockerCommand(
    `build -t ${name}:${tag} ${codesFolder}/${name}_${tag}`
  );
};
