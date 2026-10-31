const withAuth = (req, res, next) => {
  // Not logged in? Send them to the login page
  if (!req.session.logged_in) {
    res.redirect('/login');
    return;
  }

  // Logged in, so move on to the route
  next();
};

module.exports = withAuth;
