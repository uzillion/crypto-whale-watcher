const trades = require('../db/trades');
const orders = require('../db/orders');

const testDB = async () => {
  let trade_test_1 = trades.getVolFilter();
  let trade_test_2 = trades.getMinWorth();
  let trade_test_3 = trades.setMinWorth('BTC', 70000);
  let trade_test_4 = trades.setVolFilter(0);
  let order_test_1 = orders.getMinRatio();
  let order_test_2 = orders.getMinWorth();
  let order_test_3 = orders.getVolFilter();
  let order_test_4 = orders.setMinWorth('BTC', 1000000);
  let order_test_5 = orders.setMinRatio(2.5);
  let order_test_6 = orders.setVolFilter(0);

  await Promise.all([
    trade_test_1,
    trade_test_2,
    trade_test_3,
    trade_test_4,
    order_test_1,
    order_test_2,
    order_test_3,
    order_test_4,
    order_test_5,
    order_test_6
  ]);
}

module.exports = testDB;