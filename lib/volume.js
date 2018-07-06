const request = require('request-promise-native');

let exchange_volumes = {
  binance: {},
  bitfinex: {},
  gdax: {}
};

let tickerOptions = {
  uri: '',
  headers: {
    'User-Agent': 'Request-Promise'
  },
  json: true
};

const refresh_volumes = () => {
  ["BTCUSDT", "EOSUSDT", "ETHUSDT"].forEach((symbol) => {
    tickerOptions.uri = `https://api.binance.com/api/v1/ticker/24hr?symbol=${symbol}`;
    request(tickerOptions)
    .then(function (tickerResponse) {
      exchange_volumes.binance[symbol] = parseFloat(tickerResponse.volume);
    }).catch(function (err) {
      console.log("binance:", err.message);
    });
  });
  
  ["BTCUSD", "LTCUSD", "EOSUSD", "ETHUSD"].forEach((symbol) => {
    tickerOptions.uri = `https://api.bitfinex.com/v2/candles/trade:1D:t${symbol}/last`; 
    request(tickerOptions)
    .then(function (tickerResponse) {
      exchange_volumes.bitfinex[symbol] = tickerResponse[5];
    }).catch(function (err) {
      console.log("bitfinex:", err.message);
    });
  });
  
  ["BTC-USD", "LTC-USD", "ETH-USD"].forEach((symbol) => {
    tickerOptions.uri = `https://api.gdax.com/products/${symbol}/ticker`;  
    request(tickerOptions)
    .then(function (tickerResponse) {
      exchange_volumes.gdax[symbol] = parseFloat(tickerResponse.volume);
    }).catch(function (err) {
      console.log("gdax", err.message);
    });
  });
}

refresh_volumes()
setInterval(refresh_volumes, 3600000);

module.exports = {exchange_volumes, refresh_volumes}