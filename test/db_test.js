const trade = require('../db/trade');
const volume = require('../db/volume');

const testDB = async () => {
  let trade_test_1 = trade.getVolFilter();
  let trade_test_2 = trade.getMinWorth();
  let trade_test_3 = trade.setMinWorth('BTC', 70000);
  let trade_test_4 = trade.setVolFilter(0);
  let volume_test_1 = volume.getMinRatio();
  let volume_test_2 = volume.getMinWorth();
  let volume_test_3 = volume.setMinWorth('BTC', 1000000);
  let volume_test_4 = volume.setMinRatio(2.5);

  await Promise.all([
    trade_test_1,
    trade_test_2,
    trade_test_3,
    trade_test_4,
    volume_test_1,
    volume_test_2,
    volume_test_3,
    volume_test_4
  ]);
}

module.exports = testDB;