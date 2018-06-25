const sqlite3 = require("better-sqlite3");
const db = sqlite3('./db/whale-watch.db', {fileMustExist: true});

module.exports = db;
