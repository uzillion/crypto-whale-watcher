const message = require('../message');
const volumes = require('../volume').exchange_volumes;
const alerts = require('../../config').trade.alerts;
const trades = require('../../db/trades');
const {usd_values} = require("../pairs");

let prev_maker_order_id = "";
let prev_taker_order_id = "";
let prev_quantity = 0;

let min_worth = {};
trades.getMinWorth().then((data) => {
  min_worth = data;
});

let volume_filter = 0; // Recommended value = 0.001
trades.getVolFilter().then((data) => {
  volume_filter = data/100;
});


const updateLimits = () => {
  trades.getMinWorth().then((data) => {
    min_worth = data;
  });
  trades.getVolFilter().then((data) => {
    volume_filter = data/100;
  });
}

const gdax = (trade) => {
  let isAggregate = false;
  let maker_order_id = trade.maker_order_id;
  let taker_order_id = trade.taker_order_id;
  let quantity = parseFloat(trade.size);
  let price = trade.price;
  let side = trade.side;
  let symbol = trade.product_id;
  let base = symbol.substr((symbol.substr(-4) == "USDT"?-4:-3)); // Base Exchange currency
  let currency = symbol.replace(base, ""); // Actual Traded Currency

  if((maker_order_id === prev_maker_order_id) || (taker_order_id === prev_taker_order_id)) {
    quantity = quantity + prev_quantity;
    prev_quantity = quantity;
    isAggregate = true;
  } else if(typeof trade.size !== "undefined") {
    prev_maker_order_id = maker_order_id;
    prev_taker_order_id = taker_order_id;
    prev_quantity = quantity;
  }

  let usdExp = /^USD(T)?$/;

  let trade_worth = quantity * price * 
    (usdExp.test(base)?1:usd_values[base]);
    
  if(trade_worth > min_worth[currency]) {
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
    
    if(quantity >= volume_filter*volume && alerts) {
      message(messageObj);
    }
  }
}

module.exports = {gdax, updateLimits};