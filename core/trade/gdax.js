const message = require('../message');
const volumes = require('../volume').exchange_volumes;
const alerts = require('../../config').trade.alerts;
const trade = require('../../db/trade');

let min_worth = trade.getMinWorth();
let volume_filter = trade.getVolFilter() / 100; // Recommended value = 0.001

let prev_maker_order_id = "";
let prev_taker_order_id = "";
let prev_quantity = 0;

const updateLimits = () => {
  min_worth = trade.getMinWorth();
  volume_filter = trade.getVolFilter() / 100;
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
  if(quantity*price > min_worth[currency]) {
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

module.exports = {gdax, updateLimits};