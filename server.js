const path = require("path");
const express = require("express"); //Toolkit
const exphbs = require("express-handlebars");
const routes = require("./controllers");
const helpers = require("./utils/helpers");
const sequelize = require("./config/connection");

const app = express(); //Server gets built using toolkits required above
const PORT = process.env.PORT || 3001;

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
