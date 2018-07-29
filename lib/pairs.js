const default_pairs = require('../config.js').currencies;

const request = require('request-promise-native');

const usd_values = {};


const refreshUsdValues = () => {
  let base_currencies = [];
  let request_string = "";
  
  default_pairs.forEach((pair, index) => {
    let base = pair.substr(-3).toUpperCase();
    if(base != "USD" && base_currencies.indexOf(base) == -1) {
      request_string += `t${base}USD,`;
      base_currencies.push(base);
    }
  });
  
  request_string = request_string.replace(/,$/g, "");
  
  let tickerOptions = {
    uri: `https://api.bitfinex.com/v2/tickers?symbols=${request_string}`,
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true
  };
  
  // console.log(tickerOptions.uri);

  request(tickerOptions).then((data) => {
    data.forEach((ticker) => {
      usd_values[ticker[0].substr(1, ticker[0].length-4)] = ticker[7];
    });
  }).catch((error) => console.log(error));
}
refreshUsdValues();
let  interval_id = setInterval(refreshUsdValues, 3600000);

const getPairs = (exchange) => {
  let pairs = [];
  if(exchange == undefined) {
    pairs = default_pairs;
  }
  else if(exchange.toLowerCase() === "binance") {
    default_pairs.forEach((pair) => {
      if(pair.substr(-3) == "USD")
      pair += "T";
      pairs.push(pair);
    });
  }
  else if(exchange.toLowerCase() === "gdax") {
    // pairs = ["BTC-USD", "ETH-USD", "LTC-USD", "ETH-BTC", "LTC-BTC"]
    default_pairs.forEach((pair) => {
        const supported_symbols = ["BTC", "LTC", "USD", "ETH", "BCH", "EUR"]
        let formatted = pair.substr(0, pair.length - 3) + "-" + pair.substr(-3, 3);
        let symbols = formatted.split('-');
        if((supported_symbols.indexOf(symbols[0]) != -1) && (supported_symbols.indexOf(symbols[1]) != -1))
          pairs.push(formatted);
      });
    }
    
    return pairs;
  }
  
  const getCurrencies = () => {
  let trading_currencies = [];
  
  default_pairs.forEach((pair) => {
    let base = pair.substr(-3); // Base Exchange currency
    let currency = pair.replace(base, ""); // Actual Traded Currency
    if(trading_currencies.indexOf(currency) == -1) {
      trading_currencies.push(currency);
    }
  });
  return trading_currencies.sort();
}

module.exports = {getPairs, getCurrencies, usd_values, interval_id};
