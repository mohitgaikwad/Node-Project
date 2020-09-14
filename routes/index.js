const express = require("express");
const path = require("path");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");

router.route("/").get((req, res, next) => {
  res.render("welcome");
});

router.route("/dashboard").get(ensureAuthenticated, (req, res, next) => {
  res.render("dashboard", {
    name: req.user.name,
    id: req.user.id,
    photo_name: req.user.photo,
  });
});

module.exports = router;
