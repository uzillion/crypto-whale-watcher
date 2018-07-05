const trade = require('../db/trade');
const volume = require('../db/volume');
const request = require('request-promise-native');
const http = require('http');
const app = require('../app');

let server = http.createServer(app);

server.listen(3000)

server.on('listening', () => {
  let web_test = request('http://localhost:3000');
  
  let trade_test_1 = trade.getVolFilter();
  let trade_test_2 = trade.getMinWorth();
  let trade_test_3 = trade.setMinWorth('BTC', 70000);
  let trade_test_4 = trade.setVolFilter(0);
  
  let volume_test_1 = volume.getMinRatio();
  let volume_test_2 = volume.getMinWorth();
  let volume_test_3 = volume.setMinWorth('BTC', 1000000);
  let volume_test_4 = volume.setMinRatio(2.5);
  
  Promise.all([
    web_test,
    trade_test_1,
    trade_test_2,
    trade_test_3,
    trade_test_4,
    volume_test_1,
    volume_test_2,
    volume_test_3,
    volume_test_4,
  ]).then(() => {
    server.close();
    console.log("All tests completed")
    process.exit(0);
  }).catch((err) => {
    server.close();
    console.error(err.stack);
    process.exit(1);
  });
});