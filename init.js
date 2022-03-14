const fs = require("fs");
const path = require("path");

const storageFolder = path.join(__dirname, "storage");
const codesFolder = path.join(storageFolder, "codes");
const applicationsFolder = path.join(storageFolder, "applications");

async function init() {
  if (!fs.existsSync(storageFolder)) {
    fs.mkdirSync(storageFolder);
  }
  if (!fs.existsSync(codesFolder)) {
    fs.mkdirSync(codesFolder);
  }
  if (!fs.existsSync(applicationsFolder)) {
    fs.mkdirSync(applicationsFolder);
  }
}

module.exports = init;
