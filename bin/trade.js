const request = require('request-promise-native');
const message = require('./message');

const binance = (data) => {
  let trade = JSON.parse(data);
  let quantity = parseFloat(trade.q);
  let price = parseFloat(trade.p);
  let symbol = trade.s;
  
  if((symbol == "BTCUSDT" && quantity > 4) || (symbol == "EOSBTC" && quantity > 1000)) {
  var tickerOptions = {
    uri: `https://api.binance.com/api/v1/ticker/24hr?symbol=${symbol}`,
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true
  };

  request(tickerOptions)
  .then(function (tickerResponse) {
    // console.log(parseFloat(JSON.stringify(tickerResponse.volume)));
    let volume = parseFloat(tickerResponse.volume);
    // console.log(0.001*volume);
    if(quantity >= 0.001*volume) {
      let messageObj = {
        event: "TRADE",
        symbol,
        quantity,
        price,
        exchange: "Binance"
      }
      message(messageObj);
    }
  }).catch(function (err) {
    console.log("Could not get volume");
  });
  }
  // console.log(parseFloat(trade.q));
}

const bitfinex = (data) => {
  let trade = JSON.parse(data);
  let channel_id = -1;
  if(trade.chanId)
    channel_id = trade.chanId;
  else if(typeof trade[0] == "number")
    channel_id = trade[0];

  if(trade[2] != undefined)
  if(trade[1] == "tu" && Math.abs(trade[2][2]) > 4) {
    let quantity = trade[2][2];
    let price = trade[2][3]
    var tickerOptions = {
      uri: `https://api.bitfinex.com/v2/candles/trade:1D:tBTCUSD/last`,
      headers: {
        'User-Agent': 'Request-Promise'
      },
      json: true
    };
  
    request(tickerOptions)
    .then(function (tickerResponse) {
      let volume = tickerResponse[5];
      if(Math.abs(quantity) > (0.001*volume)) {
        let messageObj = {
          event: "TRADE",
          symbol: "BTCUSD",
          quantity,
          price,
          exchange: "Bitfinex"
        }
        message(messageObj);
      }
      
    }).catch(function (err) {
      console.log(err);
    });
  }
}

const gdax = (data) => {

}
module.exports = {binance, bitfinex, gdax};