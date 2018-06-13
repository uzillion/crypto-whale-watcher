const request = require('request-promise-native');
const message = require('./message');

let prev_maker_order_id = "";
let prev_taker_order_id = "";
let prev_quantity = 0;

let channel_pair = {};

const binance = (data) => {
  let trade = JSON.parse(data);
  let quantity = parseFloat(trade.q);
  let price = parseFloat(trade.p);
  let symbol = trade.s;
  let isMaker = trade.m;
  
  if((symbol == "BTCUSDT" && quantity > 7) || (symbol == "EOSUSDT" && quantity > 1000) || (symbol == "ETHUSDT" && quantity > 150)) {
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
    // console.log(0.002*volume);
    if(quantity >= 0.002*volume) {
      let messageObj = {
        event: "TRADE",
        symbol,
        quantity,
        price,
        exchange: "Binance"
      }

      if(isMaker)
        messageObj.quantity *= -1;
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
  if(trade.chanId) {
    channel_id = trade.chanId;
    channel_pair[channel_id] = trade.pair;
  } else if(typeof trade[0] == "number")
    channel_id = trade[0];

  if(trade[2] != undefined) {
  let quantity = trade[2][2];
  let absQuant = Math.abs(quantity);
  let symbol = channel_pair[channel_id];
  if(trade[1] == "tu" && ((symbol == "BTCUSD" && absQuant > 7) || (symbol == "EOSUSD" && absQuant > 1000) 
      || (symbol == "LTCUSD" && absQuant > 350) || (symbol == "ETHUSD" && absQuant > 150))) {
    let price = trade[2][3]
    var tickerOptions = {
      uri: `https://api.bitfinex.com/v2/candles/trade:1D:t${symbol}/last`,
      headers: {
        'User-Agent': 'Request-Promise'
      },
      json: true
    };

    request(tickerOptions)
    .then(function (tickerResponse) {
      let volume = tickerResponse[5];
      if(absQuant > (0.002*volume)) {
        let messageObj = {
          event: "TRADE",
          symbol,
          quantity,
          price,
          exchange: "Bitfinex"
        }
        message(messageObj);
      }
      
    }).catch(function (err) {
      console.log(err.message);
    });
  }
  }
}

const gdax = (data) => {
  let isAggregate = false;
  let trade = JSON.parse(data);
  let maker_order_id = trade.maker_order_id;
  let taker_order_id = trade.taker_order_id;
  let quantity = parseFloat(trade.size);
  let price = trade.price;
  let side = trade.side;
  let symbol = trade.product_id;
  if((maker_order_id === prev_maker_order_id) || (taker_order_id === prev_taker_order_id)) {
    quantity = quantity + prev_quantity;
    prev_quantity = quantity;
    isAggregate = true;
  } else if(typeof trade.size !== "undefined") {
    prev_maker_order_id = maker_order_id;
    prev_taker_order_id = taker_order_id;
    prev_quantity = quantity;
  }
  if((symbol == "BTC-USD" && quantity > 7) || (symbol == "LTC-USD" && quantity > 350) || (symbol == "ETH-USD" && quantity > 150)) {
    var tickerOptions = {
      uri: `https://api.gdax.com/products/${symbol}/ticker`,
      headers: {
        'User-Agent': 'Request-Promise'
      },
      json: true
    };

    request(tickerOptions)
    .then(function (tickerResponse) {
      // console.log(tickerResponse);
      let volume = parseFloat(tickerResponse.volume);
      // console.log(0.002*volume)
      if(quantity > (0.002*volume)) {
        let messageObj = {
          event: "TRADE",
          symbol,
          quantity,
          price,
          exchange: "gdax",
          isAggregate,
          taker_order_id,
          maker_order_id
        }
        if(side == "buy")
          messageObj.quantity *= -1;
        message(messageObj);
      }
      
    }).catch(function (err) {
      console.log(err.message);
    });
  }
}
module.exports = {binance, bitfinex, gdax};