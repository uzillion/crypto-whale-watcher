const request = require('request-promise-native');
const message = require('./message');
const volumes = require('./volume').exchange_volumes;

let channel_pair = {};

let sell_total = 0;
let buy_total = 0;

let book = {};

const alerts = false;

let sensitivity = 6;

let min_worth = {
  "BTC": 100,
  "ETH": 1300,
  "EOS": 60000,
  "LTC": 6000
}

const updateBook = (channel_id, option) => {
  book[channel_id].forEach((pricePoint) => {
    if(pricePoint[2] > 0 && option != "sell") {
      buy_total += pricePoint[2];
    } else if(option != "buy") {
      sell_total += Math.abs(pricePoint[2]);
    }
  })
}

const bitfinex = (order) => {
  // console.log(order)
  let channel_id = -1;
  if(order.chanId) {
    channel_id = order.chanId;
    // console.log(order.symbol)
    channel_pair[channel_id] = order.pair;
  } else if(typeof order[0] == "number" && channel_pair[order[0]]) {
    channel_id = order[0];
    if(order[1] != undefined && typeof order[1][0] == "number" && order[1].length == 3) {
      let quantity = order[1][2];
      let absQuant = Math.abs(quantity);
      let symbol = channel_pair[channel_id];
      let currency = symbol.substring(0, 3);
      let count = order[1][1];
      let price = order[1][0];
      let index = book[channel_id].findIndex(x => x[0] == price);
      if(count > 0) {
        if(index != -1) {
          book[channel_id][index] = [price, count, quantity];
          quantity > 0 ? updateBook(channel_id, "buy") : updateBook(channel_id, "sell");
        } else {
          book[channel_id].push([price, count, quantity]);
        }
      } else {
        quantity > 0 ? updateBook(channel_id, "buy") : updateBook(channel_id, "sell");
        book[channel_id].splice(index, 1);
      }
      if((sell_total*price > min_worth[currency]) || (buy_total*price > min_worth[currency])) {
        console.log(sell_total, buy_total);
        let sb_ratio = sell_total/buy_total;
        let volume = volumes.bitfinex[symbol];
        let messageObj = {
          event: "WALL",
          side: "",
          symbol,
          size: 0,
          price,
          exchange: "Bitfinex"
        }
        if(sb_ratio > sensitivity && alerts) {
          messageObj.side = "sell";
          messageObj.size = sb_ratio;
          message(messageObj);
        }
        else if((1/sb_ratio) > sensitivity && alerts) {
          messageObj.side = "buy";
          messageObj.size = 1/sb_ratio;
          message(messageObj);
        }
      }
      // Problem: Finding the best way to correlate the huge influx of orders with the number of orders
    } else if(order[1][0][0] != undefined) {
      book[channel_id] = order[1];
      
    }
  }
  
}

module.exports = {bitfinex};