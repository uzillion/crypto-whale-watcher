/**
 * Responsible for handling trade streams from different exchanges.
 * The trade streams are constantly gone through to check for big trades.
 * If a trade meets the condition for being counted as a big trade, it is forwarded to messaging function for alerting the user.
 */

const message = require('./message');
const volumes = require('./volume').exchange_volumes;
const alerts = require('../config').trade.alerts;

const trade = require('../db/trade');

let min_cost = trade.getMinWorth();

// let min_cost = {
//   "BTC": 70000,
//   "ETH": 60000,
//   "EOS": 50000,
//   "LTC": 40000
// }

let volume_filter = trade.getVolFilter() / 100; // Recommended value = 0.001

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
    
    if(quantity*price >= volume_filter*volume && alerts) {
      message(messageObj);
    }
  }
}

const bitfinex = (trade) => {
  let channel_id = -1;

  // Bitfinex API does not provide symbols after first stream message.
  // Instead it provides a channel-id associated with a stream for a crypto pair.
  if(trade.chanId) {
    channel_id = trade.chanId;
    channel_pair[channel_id] = trade.pair;  // Associating channel_id with symbol (pair) for future lookup.
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
      if(absQuant >= volume_filter*volume && alerts) {
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
    
    if(quantity*price >= volume_filter*volume && alerts) {
      message(messageObj);
    }
  }
}
module.exports = {binance, bitfinex, gdax, min_cost, volume_filter};