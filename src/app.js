const express = require("express");
const app = express();
const path = require("path");
const port = process.env.PORT || 3000;
const hbs = require("hbs");
const viewsPath = path.join(__dirname, "../views");
const Partials_path = path.join(__dirname, "../views/partials");
const store = require("../middleware/multer");
require("../database/database")();
const uploadModel = require("../model/uploadSchema");
const fs = require("fs");

app.use(express.json());

// Serving the static files
app.use(express.static(path.join(__dirname, "public")));

// SETUP VIEW ENGINE
app.set("view engine", "hbs");
app.set("views", viewsPath);
hbs.registerPartials(Partials_path);

// app.engine(
//   "hbs",
//   hbs({
//     extname: "hbs",
//     defaultView: "default",
//     layoutsDir: path.join(__dirname, "views"),
//     partialsDir: path.join(__dirname, "views/partials"),
//   })
// );

// ROUTINGS
app.get("/", async (req, res) => {
  const All_Images = await uploadModel.find();
  res.render("index", { images: All_Images });
});

app.post("/uploadmultiple", store.array("images", 12), (req, res, next) => {
  const files = req.files;

  if (!files) {
    const err = new Error("Please choose files");
    error.httpStatusCode = 400;
    return next(err);
  }

  // COVERT IMAGES INTO BASE 64 ENCODING
  let imgArray = files.map((file) => {
    let img = fs.readFileSync(file.path);

    return (encode_image = img.toString("base64"));
  });

  let result = imgArray.map((src, index) => {
    // Create an object to store data in the database
    let fileImg = {
      filename: files[index].originalname,
      contentType: files[index].mimetype,
      imageBase64: src,
    };

    let newUpload = new uploadModel(fileImg);
    return newUpload
      .save()
      .then(() => {
        return {
          msg: `${files[index].originalname} img uploaded sucessfully..!`,
        };
      })
      .catch((error) => {
        if (error) {
          if (error.name === "MongoError" && error.code === 11000) {
            return Promise.reject({
              error: `Duplicate ${files[index].originalname} File is already Exists`,
            });
          }
          return Promise.reject({
            error:
              error.message || `Cannot Upload ${files[index].originalname}`,
          });
        }
      });
  });

  Promise.all(result)
    .then((msg) => {
      // res.json(msg);
      res.redirect("/");
    })
    .catch((err) => {
      res.json(err);
    });
});

app.listen(port, () => {
  console.log(`OUR SERVER IS ACTIVE :) http://127.0.0.1:${port}/`);
});
