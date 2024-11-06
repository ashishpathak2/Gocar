const dotenv = require('dotenv');
dotenv.config({ path: "./config.env" })


var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var db = require("./src/config/dbConn")
const session = require('express-session');
const flash = require('connect-flash');



var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');
var passport = require('passport');
const user = require("./src/models/userModel");
const passportGoogleSetup = require('./src/config/passportGoogle');
const MongoDBStore = require('connect-mongodb-session')(session); 
const {flashMessageMiddleware} = require("./src/middlewares/flashMessage")

const store = new MongoDBStore({
  uri: process.env.DATABASE_URL,
  collection: 'sessions'
});


var app = express();
// Apply the middleware to the router

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



store.on('error', function(error) {
    console.error(error);
});


app.use(session({
  secret: 'your-secret-key', // Replace with a strong secret key
  resave: false,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false } ,// Set to true if you're using HTTPS
}));

app.use(flash());
app.use(flashMessageMiddleware);
app.get('/favicon.ico', (req, res) => res.status(204));

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/admin', adminRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
  // Check for 404 error
  if (err.status === 404) {
    req.flash('error', 'Page not found'); // Set flash message for 404 errors
    return res.redirect(req.get('Referrer') || '/'); // Redirect to the referrer or homepage
  }

  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page for other errors
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
