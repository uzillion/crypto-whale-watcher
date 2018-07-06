const db_test = require('./db_test')();
const request = require('request-promise-native');
const http = require('http');
const app = require('../app');

let server = http.createServer(app);

server.listen(3000)

server.on('listening', () => {
  let web_test = request('http://localhost:3000');

  Promise.all([
    db_test,
    web_test
  ]).then(() => {
    server.close();
    console.log("All tests completed successfully")
    process.exit(0);
  }).catch((err) => {
    server.close();
    console.error(err);
    process.exit(1);
  });
});