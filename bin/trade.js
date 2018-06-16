const message = require('./message');
const volumes = require('./volume').exchange_volumes;

const alerts = true;

let min_cost = {
  "BTC": 50000,
  "ETH": 50000,
  "EOS": 40000,
  "LTC": 50000
}

let portion_size = 0.001;

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
  if(quantity*price > min_cost[currency]) {  
  // if((symbol == "BTCUSDT" && quantity*price > 8) || (symbol == "EOSUSDT" && quantity*price > 3000) || (symbol == "ETHUSDT" && quantity*price > 150)) {
    let volume = volumes.binance[symbol];
    let messageObj = {
      event: "TRADE",
      symbol,
      quantity,
      price,
      exchange: "Binance"
    }
    
    if(isMaker)
    messageObj.quantity *= -1;
    
    if(quantity*price >= portion_size*volume && alerts) {
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
    let price = trade[2][3]
    if(trade[1] == "tu" && (absQuant*price > min_cost[currency])) {
      let volume = volumes.bitfinex[symbol];
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
  if(quantity*price > min_cost[currency]) {
    let volume = volumes.gdax[symbol];
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
    
    if(quantity*price >= portion_size*volume && alerts) {
      message(messageObj);
    }
  }
}
module.exports = {binance, bitfinex, gdax, min_cost, portion_size};