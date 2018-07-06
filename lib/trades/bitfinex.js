const message = require('../message');
const volumes = require('../volume').exchange_volumes;
const alerts = require('../../config').trade.alerts;
const trade = require('../../db/trade');

let min_worth = {};
trade.getMinWorth().then((data) => {
  min_worth = data;
});

let volume_filter = 0; // Recommended value = 0.001
trade.getVolFilter().then((data) => {
  volume_filter = data/100;
});

let channel_pair = {};

const updateLimits = () => {
  trade.getMinWorth().then((data) => {
    min_worth = data;
  });
  trade.getVolFilter().then((data) => {
    volume_filter = data/100;
  });
}

const bitfinex = (trade) => {

  // console.log(min_worth.BTC);
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
    if(trade[1] == "tu" && (absQuant*price > min_worth[currency])) {
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

module.exports = {bitfinex, updateLimits};