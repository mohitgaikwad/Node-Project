const express = require("express");
const http = require("http");
const morgan = require("morgan");
const path = require("path");
const flash = require("connect-flash");
const passport = require("passport");
const session = require("express-session");
const methodOverride = require('method-override');
const expressLayouts = require("express-ejs-layouts");
const constants = require("./config/constants");
require("./config/passport")(passport);

const indexRouter = require("./routes/index");
const userRouter = require("./routes/users");

// Route
const app = express();
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));



//Express Session
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

app.use(expressLayouts);
app.set("view engine", "ejs");

app.use("/", indexRouter);
app.use("/users", userRouter);

const server = http.createServer(app);
server.listen(constants.port, constants.hostname, () => {
  console.log(
    `Server Running at http://${constants.hostname}:${constants.port}/`
  );
});
