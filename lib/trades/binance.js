const message = require('../message');
const volumes = require('../volume').exchange_volumes;
const alerts = require('../../config').trade.alerts;
const trades = require('../../db/trades');
const {usd_values} = require('../pairs');

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

const binance = (trade) => {
  let quantity = parseFloat(trade.q);
  let price = parseFloat(trade.p);
  let symbol = trade.s;
  let base = symbol.substr((symbol.substr(-4) == "USDT"?-4:-3)); // Base Exchange currency
  let currency = symbol.replace(base, ""); // Actual Traded Currency
  let isMaker = trade.m;

  let usdExp = /^USD(T)?$/;

  let trade_worth = quantity * price * 
    (usdExp.test(base)?1:usd_values[base]);

  if(trade_worth > min_worth[currency]) {  
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
    
    if(quantity >= volume_filter*volume && alerts) {
      message(messageObj);
    }
  }
}

module.exports = {binance, updateLimits};