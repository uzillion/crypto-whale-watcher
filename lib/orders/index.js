/**
 * Responsible for handling the order book stream.
 * The order book stream is gone through to look at the total buy and sell volume of first 20-25 orders.
 * If the ratio of these totals is significantly large, the user is alerted of the formed buy/sell wall.
 * 
 * Even though the alerts are of volume, the file is called wall.js to avoid confusion with volume.js 
 */


module.exports = {
  binance: require('./binance').binance,
  bitfinex: require('./bitfinex').bitfinex
}