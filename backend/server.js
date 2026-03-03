const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
const mongodb = require('./db/connect');
const morgan = require('morgan');
const keys = require('./config/keys');

dotenv.config({ paths: './.env' });

const app = express();
const PORT = process.env.PORT || 3000;


app.get("/", (req, res) => {
    res.send("Hello Mitchelle");
});

// API routes
app.use('/', require('./routes/index'));


// Start server
mongodb
  .initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        `Server running in on port ${PORT}`,
      );
      console.log(`API endpoints:`);
      console.log(`  - http://localhost:${PORT}/movies`);
      console.log(`  - http://localhost:${PORT}/watchlist`);
    });
  })
