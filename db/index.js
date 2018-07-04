require('dotenv').config();
const pg = require("pg-promise")();
const db = pg(process.env.DATABASE_URL);

module.exports = db;
