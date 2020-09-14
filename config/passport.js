const LocalStrategy = require("passport-local").Strategy;
const db = require("./db");
const bcrypt = require("bcryptjs");

module.exports = (passport) => {
  passport.use(
    new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
      db.query(
        `SELECT * FROM login_data where email = '${email}'`,
        (err, result) => {
          if (err) throw err;
          if (result.length != 1) {
            return done(null, false, {
              message: "That email is not registered",
            });
          }
          bcrypt.compare(password, result[0].password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) {
              return done(null, result[0]);
            } else {
              return done(null, false, { message: "Password incorrect" });
            }
          });
        }
      );
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    db.query(`SELECT * FROM user_data where id = '${id}'`, (err, result) => {
      done(err, result[0]);
    });
  });
};
