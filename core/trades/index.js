/**
 * Responsible for handling trade streams from different exchanges.
 * The trade streams are constantly gone through to check for big trades.
 * If a trade meets the condition for being counted as a big trade, it is forwarded to messaging function for alerting the user.
 */

module.exports = {
  binance: require('./binance').binance,
  bitfinex: require('./bitfinex').bitfinex,
  gdax: require('./gdax').gdax
}