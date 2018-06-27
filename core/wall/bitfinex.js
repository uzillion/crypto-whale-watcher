const message = require('../message');
const alerts = require('../../config').volume.alerts;
const volume = require('../../db/volume');

let sensitivity = volume.getMinRatio();

const sell_total = {};
const buy_total = {};
const wall = {};
const book = {};
let min_worth = volume.getMinWorth();
let channel_pair = {};

const updateLimits = () => {
  min_worth = volume.getMinWorth();
  sensitivity = volume.getMinRatio();
}


const updateBook = (key, option) => {
  // sell_total = 0;
  // buy_total = 0;
  if(buy_total[key] == undefined)
  buy_total[key] = 0;
  if(sell_total[key] == undefined)
  sell_total[key] = 0;
  book[key].forEach((pricePoint) => {
    if(pricePoint[2] > 0 && option != "sell") {
      buy_total[key] += pricePoint[2];
    } else if(pricePoint[2] < 0 && option != "buy") {
      sell_total[key] += Math.abs(pricePoint[2]);
    }
  });
}

const compare = (a, b) => {
  if(typeof a == "string" && typeof b == "string")
    return parseFloat(a[0]) - parseFloat(b[0]);
  else
    return a[0] - b[0];
}

const bitfinex = (order) => {
  let channel_id = -1;
  if(order.chanId) {
    channel_id = order.chanId;
    channel_pair[channel_id] = order.pair;
  } 
  else if(typeof order[0] == "number" && channel_pair[order[0]]) {
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
          if(book[channel_id][index][2] > 0)
          buy_total[channel_id] -= book[channel_id][index][2];
          else
          sell_total[channel_id] += book[channel_id][index][2];
          book[channel_id][index] = [price, count, quantity];
        } else {
          book[channel_id].push([price, count, quantity]);
          book[channel_id].sort(compare);
        }
        if(quantity > 0)
        buy_total[channel_id] += quantity;
        else
        sell_total[channel_id] += absQuant;
      } 
      else if(count == 0 && index != -1) {
        if(book[channel_id][index][2] > 0)
        buy_total[channel_id] -= book[channel_id][index][2];
        else
        sell_total[channel_id] += book[channel_id][index][2];
        book[channel_id].splice(index, 1);
      }
      // console.log(book[channel_id]);
      // console.log(price, quantity, book[channel_id].length, book[channel_id].length);

      // quantity > 0 ? updateBook(channel_id, "buy") : updateBook(channel_id, "sell");
      // updateBook(channel_id);
      let s_total = sell_total[channel_id];
      let b_total = buy_total[channel_id];
      // console.log(symbol, s_total, b_total);
      if((s_total*price > min_worth[currency]) || (b_total*price > min_worth[currency])) {
        let sb_ratio = s_total/b_total;
        let messageObj = {
          event: "VOLUME",
          side: "",
          symbol,
          size: 0,
          exchange: "Bitfinex"
        }
        if(sb_ratio > sensitivity && (!wall[channel_id].sell)) { // || sb_ratio > wall[channel_id].sell)) {
          // console.log("buy:",symbol, 1/sb_ratio, s_total+"/"+b_total);
          // console.log(book[channel_id]);
          messageObj.side = "Sell";
          messageObj.quantity = s_total;
          messageObj.size = sb_ratio;
          wall[channel_id] = {
            sell: sb_ratio,
            buy: false
          };
          if(alerts)
            message(messageObj);
        }
        else if((1/sb_ratio) > sensitivity && (!wall[channel_id].buy)) { // || (1/sb_ratio) > wall[channel_id].buy)) {
          // console.log("buy:",symbol, 1/sb_ratio, s_total+"/"+b_total);
          // console.log(book[channel_id]);
          messageObj.side = "Buy";
          messageObj.size = 1/sb_ratio;
          messageObj.quantity = b_total;
          wall[channel_id] = {
            sell: false,
            buy: 1/sb_ratio
          };
          if(alerts)
            message(messageObj);
        } 
        if(wall[channel_id].sell && sb_ratio < sensitivity && sb_ratio >= 1) {
          wall[channel_id].sell = false;
          // console.log(symbol+" sell volume decreased");
          messageObj.event = "WD";
          messageObj.side = "Sell";
          if(alerts)
          message(messageObj);
        }
        if(wall[channel_id].buy && 1/sb_ratio < sensitivity && 1/sb_ratio >= 1) {
          wall[channel_id].buy = false; 
          // console.log(symbol+" buy volume decreased");
          messageObj.event = "WD";
          messageObj.side = "Buy";
          if(alerts)
          message(messageObj);
        }
      }
    } else if(typeof order[1] != "string" && order[1][0][0] != undefined) {
      book[channel_id] = order[1];
      wall[channel_id] = {
        sell: false,
        buy: false
      };
      updateBook(channel_id);
    }
  }
}

module.exports = {bitfinex, updateLimits};