const path = require("path");
const express = require("express"); //Toolkit
const session = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const exphbs = require("express-handlebars");
const routes = require("./controllers");
const helpers = require("./utils/helpers");
const sequelize = require("./config/connection");

const app = express(); //Server gets built using toolkits required above
const PORT = process.env.PORT || 3001;

// Set up sessions
const sess = {
  secret: process.env.SESSION_SECRET,   // private app stamp
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,        // lasts 1 day (in milliseconds)
    httpOnly: true,                     // page JavaScript can't read the cookie (safer)
    secure: process.env.NODE_ENV === "production", // only send over https when live
    sameSite: "strict",                 // don't send the cookie to other websites
  },
  resave: false,                        // don't re-save if nothing changed
  saveUninitialized: false,             // don't make a cookie until someone logs in
  store: new SequelizeStore({ db: sequelize }), // save sessions in Postgres
};

app.set("trust proxy", 1); // Render sits in front of your app; this lets secure cookies work there
app.use(session(sess)); // Sessions must be turned on before route reads it on line 39

const hbs = exphbs.create({ helpers });

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(routes);

sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => //Starts the server, tells it to start accepting incoming requests on port 3001 (line 9)
    console.log(`🌐 Server listening on http://localhost:${PORT}`),
  );
});
