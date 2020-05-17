require('dotenv').config();
const pg = require("pg-promise")();
let db;
try {
    db = pg(process.env.DATABASE_URL);
    console.log('\033[92m\u2713\033[0m DB connected');
} catch {
    console.log('\033[91m\u2717\033[0m Could not connect to database.');
    console.log('Please make sure you have run \'npm run db:migrate\' first');
    console.log('Also, make sure correct environment variables are set.');
    process.exit(1);
}

module.exports = db;
