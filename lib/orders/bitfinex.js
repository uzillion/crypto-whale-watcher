const message = require('../message');
const alerts = require('../../config').order.alerts;
const orders = require('../../db/orders');
const {usd_values} = require('../pairs');

let sensitivity = 100;
orders.getMinRatio().then((data) => {
  sensitivity = data;
});

const sell_total = {};
const buy_total = {};
const wall = {};
const book = {};
let channel_pair = {};

let min_worth = {};
orders.getMinWorth().then((data) => {
  min_worth = data;
});

const updateLimits = () => {
  orders.getMinWorth().then((data) => {
    min_worth = data;
  });
  orders.getMinRatio().then((data) => {
    sensitivity = data;
  });
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
      let base = symbol.substr((symbol.substr(-4) == "USDT"?-4:-3)); // Base Exchange currency
      let currency = symbol.replace(base, ""); // Actual Traded Currency
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
        if(quantity > 0) {
          if(quantity > buy_total[channel_id])
            wall[channel_id].type = [price, quantity];
          buy_total[channel_id] += quantity;
        }
        else {
          if(absQuant > sell_total[channel_id])
            wall[channel_id].type = [price, absQuant];
          sell_total[channel_id] += absQuant;
        }
      } 
      else if(count == 0 && index != -1) {
        if(book[channel_id][index][2] > 0)
        buy_total[channel_id] -= book[channel_id][index][2];
        else
        sell_total[channel_id] += book[channel_id][index][2];
        book[channel_id].splice(index, 1);
      }

      let s_total = sell_total[channel_id];
      let b_total = buy_total[channel_id];

      let usdExp = /^USD(T)?$/;

      let s_worth = s_total*price*
        (usdExp.test(base)?1:usd_values[base]);
    
      let b_worth = b_total*price*
        (usdExp.test(base)?1:usd_values[base]);

      if((s_worth > min_worth[currency]) || (b_worth > min_worth[currency])) {
        let sb_ratio = s_total/b_total;
        let messageObj = {
          event: "VOLUME",
          side: "",
          type: "",
          symbol,
          size: 0,
          exchange: "Bitfinex"
        }

        if(typeof wall[channel_id].type != "object")
          wall[channel_id].type = "ladder";
        
        messageObj.type = wall[channel_id].type;
        
        if(sb_ratio > sensitivity && (!wall[channel_id].sell)) { 
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
          wall[channel_id].type = undefined;
          // console.log(symbol+" sell volume decreased");
          messageObj.event = "WD";
          messageObj.side = "Sell";
          if(alerts)
          message(messageObj);
        }
        if(wall[channel_id].buy && 1/sb_ratio < sensitivity && 1/sb_ratio >= 1) {
          wall[channel_id].buy = false; 
          wall[channel_id].type = undefined;
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