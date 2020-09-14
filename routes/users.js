const express = require("express");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../config/db");
const { ensureAuthenticated } = require("../config/auth");
const router = express.Router();

router
  .route("/register")
  .get((req, res, next) => {
    res.render("register");
  })
  .post((req, res, next) => {
    const { name, email, password, password2 } = req.body;
    let errors = [];

    if (!name || !email || !password || !password2) {
      errors.push({ msg: "Please fill in all fields" });
    }

    if (password !== password2) {
      errors.push({ msg: "Passwords do not match" });
    }

    if (password.length < 8) {
      errors.push({ msg: "Password should be at least 8 characters" });
    }

    if (errors.length > 0) {
      res.render("register", {
        errors,
        name,
        email,
        password,
        password2,
      });
    } else {
      db.query(
        `SELECT * FROM user_data where email='${email}'`,
        (err, result) => {
          if (err) throw err;
          if (result.length > 0) {
            errors.push({ msg: "Email is already registered" });
            res.render("register", {
              errors,
              name,
              email,
              password,
              password2,
            });
          } else {
            let newUser = { name: name, email: email, password: password };
            bcrypt.genSalt(10, (err, salt) => {
              bcrypt.hash(newUser.password, salt, (err, hash) => {
                if (err) throw err;
                newUser.password = hash;
                let sql = "INSERT INTO user_data SET ?";
                let query = db.query(sql, newUser, (err, result) => {
                  if (err) throw err;
                  db.query(
                    "INSERT INTO LOGIN_DATA SET ?",
                    { email: newUser.email, password: newUser.password },
                    (err, result) => {
                      if (err) throw err;
                    }
                  );
                  console.log("User data successfully added...");
                  req.flash(
                    "success_msg",
                    "You are now registered and can log in"
                  );
                  res.redirect("/users/login");
                });
              });
            });
          }
        }
      );
    }
  });

router
  .route("/login")
  .get((req, res, next) => {
    res.render("login");
  })
  .post((req, res, next) => {
    passport.authenticate("local", {
      successRedirect: "/dashboard",
      failureRedirect: "/users/login",
      failureFlash: true,
    })(req, res, next);
  });

router.route("/logout").get((req, res, next) => {
  req.logOut();
  req.flash("success_msg", "You are logged out");
  res.redirect("/users/login");
});

router
  .route("/update")
  .get(ensureAuthenticated, (req, res, next) => {
    res.render("update", {
      name: req.user.name,
      email: req.user.email,
      phoneno: req.user.phoneno,
      address: req.user.address,
    });
  })

  .put(ensureAuthenticated, (req, res, next) => {
    let errors = [];
    const storage = multer.diskStorage({
      destination: "./public/uploads/",
      filename: (req, file, cb) => {
        cb(null, req.user.id + path.extname(file.originalname));
      },
    });
    const upload = multer({
      storage: storage,
      limits: { fileSize: 3000000 },
    }).single("photo");
    upload(req, res, (err) => {
      if (err) {
        errors.push({ msg: err });
        res.render("update", {
          errors,
          name,
          email,
          phoneno,
          address,
        });
      } else {
        const { name, email, phoneno, address } = req.body;
        let photo_name = "";
        if (!name) {
          errors.push({ msg: "Please fill in Name field" });
        }
        if (!email) {
          errors.push({ msg: "Please fill in Email field" });
        }
        if (errors.length > 0) {
          res.render("update", {
            errors,
            name,
            email,
            phoneno,
            address,
          });
        } else {
          db.query(
            `SELECT * FROM user_data where id<>${req.user.id} and email='${email}'`,
            (err, result) => {
              if (err) throw err;
              if (result.length > 0) {
                errors.push({ msg: "Email is already registered" });
                res.render("update", {
                  errors,
                  name,
                  email,
                  phoneno,
                  address,
                });
              } else {
                if (typeof req.file != "undefined") {
                  photo_name = req.file.filename;
                }
                else {
                  if (fs.existsSync(path.join(path.resolve(__dirname, '..'), '/public/uploads/' + req.user.photo))) {
                    photo_name = req.user.photo;
                  }
                  else {
                    photo_name = "";
                  }
                }
                let sql = `UPDATE user_data SET name='${name}', email='${email}', phoneno='${phoneno}', photo='${photo_name}', address='${address}' where id=${req.user.id}`;
                db.query(sql, (err, result) => {
                  if (err) throw err;
                  console.log(
                    `User data of ${req.user.name} has been  successfully updated...`
                  );
                  req.flash(
                    "success_msg",
                    "Your data has successfully updated"
                  );
                  res.redirect("/dashboard");
                });
              }
            }
          );
        }
      }
    });
  });

module.exports = router;
