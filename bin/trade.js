const request = require('request-promise-native');
const message = require('./message');

const alerts = true;

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

let min_quant = {
  "BTC": 10,
  "ETH": 200,
  "EOS": 3000,
  "LTC": 450
}

let portion_size = 0.001;

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

  // console.log(exchange_volumes);
}

refresh_volumes();
setInterval(refresh_volumes, 3600000);

let prev_maker_order_id = "";
let prev_taker_order_id = "";
let prev_quantity = 0;

let channel_pair = {};

const binance = (trade) => {
  let quantity = parseFloat(trade.q);
  let price = parseFloat(trade.p);
  let symbol = trade.s;
  let isMaker = trade.m;
  let currency = symbol.substring(0, 3);
  if(quantity > min_quant[currency]) {  
  // if((symbol == "BTCUSDT" && quantity > 8) || (symbol == "EOSUSDT" && quantity > 3000) || (symbol == "ETHUSDT" && quantity > 150)) {
    let volume = exchange_volumes.binance[symbol];
    let messageObj = {
      event: "TRADE",
      symbol,
      quantity,
      price,
      exchange: "Binance"
    }
    
    if(isMaker)
    messageObj.quantity *= -1;
    
    if(quantity >= portion_size*volume && alerts) {
      message(messageObj);
    }
  }
}

const bitfinex = (trade) => {
  
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
    let currency = symbol.substring(0, 3);
    if(trade[1] == "tu" && (quantity > min_quant[currency])) {
      let volume = exchange_volumes.bitfinex[symbol];
      let price = trade[2][3]
      let messageObj = {
        event: "TRADE",
        symbol,
        quantity,
        price,
        exchange: "Bitfinex"
      }
      if(absQuant >= portion_size*volume && alerts) {
        message(messageObj);
      }
    }
  }
}

const gdax = (trade) => {
  let isAggregate = false;
  let maker_order_id = trade.maker_order_id;
  let taker_order_id = trade.taker_order_id;
  let quantity = parseFloat(trade.size);
  let price = trade.price;
  let side = trade.side;
  let symbol = trade.product_id;
  let currency = symbol.substring(0, 3);
  if((maker_order_id === prev_maker_order_id) || (taker_order_id === prev_taker_order_id)) {
    quantity = quantity + prev_quantity;
    prev_quantity = quantity;
    isAggregate = true;
  } else if(typeof trade.size !== "undefined") {
    prev_maker_order_id = maker_order_id;
    prev_taker_order_id = taker_order_id;
    prev_quantity = quantity;
  }
  if(quantity > min_quant[currency]) {
    let volume = exchange_volumes.gdax[symbol];
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
    
    if(quantity >= portion_size*volume && alerts) {
      message(messageObj);
    }
  }
}
module.exports = {binance, bitfinex, gdax, min_quant, portion_size};