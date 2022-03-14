require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const init = require("./init");

const PORT = process.env.PORT || 3020;

const app = express();

app.use(cors());
app.use(express.json({ limit: "200mb" }));

app.use("/app-management/images", require("./routes/image-route"));
app.use(
  "/app-management/build-templates",
  require("./routes/build-template-route")
);
app.use("/app-management/applications", require("./routes/app-route"));

mongoose
  .connect(process.env.DB_CONNECTION)
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
    init();
  })
  .catch(console.log);
