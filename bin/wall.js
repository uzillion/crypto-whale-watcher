const message = require('./message');
const volumes = require('./volume').exchange_volumes;

let channel_pair = {};

let sell_total = {
  "bitfinex": {
  }
};
let buy_total = {
  "bitfinex": {
  }
};

let wall = {
  "bitfinex": {
  }
}

let book = {};

const alerts = true;

let sensitivity = 3;

let min_worth = {
  "BTC": 1000000,
  "ETH": 1000000,
  "EOS": 1000000,
  "LTC": 1000000
}

const updateBook = (channel_id, option) => {
  // sell_total = 0;
  // buy_total = 0;
  if(buy_total.bitfinex[channel_id] == undefined)
  buy_total.bitfinex[channel_id] = 0;
  if(sell_total.bitfinex[channel_id] == undefined)
  sell_total.bitfinex[channel_id] = 0;
  book[channel_id].forEach((pricePoint) => {
    if(pricePoint[2] > 0 && option != "sell") {
      buy_total.bitfinex[channel_id] += pricePoint[2];
    } else if(pricePoint[2] < 0 && option != "buy") {
      sell_total.bitfinex[channel_id] += Math.abs(pricePoint[2]);
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
          if(book[channel_id][index][2] > 0)
          buy_total.bitfinex[channel_id] -= book[channel_id][index][2];
          else
          sell_total.bitfinex[channel_id] += book[channel_id][index][2];
          book[channel_id][index] = [price, count, quantity];
        } else {
          // console.log(price, count, quantity);
          book[channel_id].push([price, count, quantity]);
        }
        if(quantity > 0)
        buy_total.bitfinex[channel_id] += quantity;
        else
        sell_total.bitfinex[channel_id] += absQuant;
      } 
      else if(count == 0 && index != -1) {
        if(book[channel_id][index][2] > 0)
        buy_total.bitfinex[channel_id] -= book[channel_id][index][2];
        else
        sell_total.bitfinex[channel_id] += book[channel_id][index][2];
        book[channel_id].splice(index, 1);
      }
      // quantity > 0 ? updateBook(channel_id, "buy") : updateBook(channel_id, "sell");
      // updateBook(channel_id);
      let s_total = sell_total.bitfinex[channel_id];
      let b_total = buy_total.bitfinex[channel_id];
      if((s_total*price > min_worth[currency]) || (b_total*price > min_worth[currency])) {
        let sb_ratio = s_total/b_total;
        // console.log(symbol, s_total, b_total);
        // let volume = volumes.bitfinex[symbol];
        let messageObj = {
          event: "WALL",
          side: "",
          symbol,
          size: 0,
          exchange: "Bitfinex"
        }
        if(sb_ratio > sensitivity && alerts && !wall.bitfinex[channel_id].sell) {
          // console.log(book[channel_id]);
          // console.log("sell:", symbol, sb_ratio, s_total+"/"+b_total);
          messageObj.side = "Sell";
          messageObj.size = sb_ratio;
          wall.bitfinex[channel_id] = {
            sell: true,
            buy: false
          };
          message(messageObj);
        }
        else if((1/sb_ratio) > sensitivity && alerts && !wall.bitfinex[channel_id].buy) {
          // console.log(book[channel_id]);
          // console.log("buy:",symbol, 1/sb_ratio, s_total+"/"+b_total);
          messageObj.side = "Buy";
          messageObj.size = 1/sb_ratio;
          wall.bitfinex[channel_id] = {
            sell: false,
            buy: true
          };
          message(messageObj);
        } 
        if(sb_ratio < sensitivity && sb_ratio >= 1)
        wall.bitfinex[channel_id].sell = false;
        if(1/sb_ratio < sensitivity && 1/sb_ratio >= 1)
        wall.bitfinex[channel_id].buy = false; 
      }
    } else if(typeof order[1] != "string" && order[1][0][0] != undefined) {
      book[channel_id] = order[1];
      wall.bitfinex[channel_id] = {
        sell: false,
        buy: false
      };
      updateBook(channel_id);
    }
  }
  
}

module.exports = {bitfinex};