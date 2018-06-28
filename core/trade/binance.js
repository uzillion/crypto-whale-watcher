const message = require('../message');
const volumes = require('../volume').exchange_volumes;
const alerts = require('../../config').trade.alerts;
const trade = require('../../db/trade');

let min_worth = trade.getMinWorth();
let volume_filter = trade.getVolFilter() / 100; // Recommended value = 0.001

const updateLimits = () => {
  min_worth = trade.getMinWorth();
  volume_filter = trade.getVolFilter() / 100;
}

const binance = (trade) => {
  let quantity = parseFloat(trade.q);
  let price = parseFloat(trade.p);
  let symbol = trade.s;
  let isMaker = trade.m;
  let currency = symbol.substring(0, 3);

  if(quantity*price > min_worth[currency]) {  
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

module.exports = {binance, updateLimits};