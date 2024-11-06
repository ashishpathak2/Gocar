function setCityName(req, res, next) {
  // Set a default city name if not present in session
  res.locals.cityName = req.session.locationName;
  next();
}

module.exports = { setCityName };
