/**
 * Responsible for handling the order book stream.
 * The order book stream is gone through to look at the total buy and sell volume of first 20-25 orders.
 * If the ratio of these totals is significantly large, the user is alerted of the formed buy/sell wall.
 * 
 * Even though the alerts are of volume, the file is called wall.js to avoid confusion with volume.js 
 */

const message = require('./message');
const request = require('request-promise-native');
const sd = require('./sd');
const alerts = require('../config').volume.alerts;
const volume = require('../db/volume');

let sensitivity = volume.getMinRatio(); // Minimum 1

let first = {};

let channel_pair = {};

let requestOptions = {
  uri: '',
  headers: {
    'User-Agent': 'Request-Promise'
  },
  json: true
};

let sell_total = {
  "bitfinex": {},
  "binance": {},
  "gdax": {}
};
let buy_total = {
  "bitfinex": {},
  "binance": {},
  "gdax": {}
};

let wall = {
  "bitfinex": {},
  "binance": {},
  "gdax": {}
}

let book = {
  "bitfinex": {},
  "binance": {},
  "gdax": []
};

let min_worth = volume.getMinWorth();

// let min_worth = {
//   "BTC": 1000000,
//   "ETH": 800000,
//   "EOS": 800000,
//   "LTC": 500000
// }
// let min_worth = {
//   "BTC": 0,
//   "ETH": 0,
//   "EOS": 0,
//   "LTC": 0
// }

const updateBook = (key, option) => {
  // sell_total = 0;
  // buy_total = 0;
  if(buy_total.bitfinex[key] == undefined)
  buy_total.bitfinex[key] = 0;
  if(sell_total.bitfinex[key] == undefined)
  sell_total.bitfinex[key] = 0;
  book.bitfinex[key].forEach((pricePoint) => {
    if(pricePoint[2] > 0 && option != "sell") {
      buy_total.bitfinex[key] += pricePoint[2];
    } else if(pricePoint[2] < 0 && option != "buy") {
      sell_total.bitfinex[key] += Math.abs(pricePoint[2]);
    }
  });
}

const compare = (a, b) => {
  if(typeof a == "string" && typeof b == "string")
    return parseFloat(a[0]) - parseFloat(b[0]);
  else
    return a[0] - b[0];
}

const saveBook = () => {
  ["BTCUSDT", "EOSUSDT", "ETHUSDT"].forEach((symbol) => {
    first[symbol] = true;
    requestOptions.uri = `https://www.binance.com/api/v1/depth?symbol=${symbol}&limit=20`;
    
    request(requestOptions)
    .then((data) => {
      book.binance[symbol] = {};
      book.binance[symbol].lastUId = data.lastUpdateId;
      book.binance[symbol].bids = data.bids;
      book.binance[symbol].asks = data.asks;
      book.binance[symbol].bids.sort(compare);
      book.binance[symbol].asks.sort(compare);

      // console.log(book.binance[symbol]);
      buy_total.binance[symbol] = 0;
      sell_total.binance[symbol] = 0;

      book.binance[symbol].bids.forEach((pricePoint) => {
        buy_total.binance[symbol] += parseFloat(pricePoint[1]);
      });
      
      book.binance[symbol].asks.forEach((pricePoint) => {
        sell_total.binance[symbol] += parseFloat(pricePoint[1]);
      })

      ready = true;
    }).catch((err) => {console.log("Binance Order book: ", err.message)});

    wall.binance[symbol] = {
      sell: false,
      buy: false
    };
  });
}

saveBook();

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
      let index = book.bitfinex[channel_id].findIndex(x => x[0] == price);
      if(count > 0) {
        if(index != -1) {
          if(book.bitfinex[channel_id][index][2] > 0)
          buy_total.bitfinex[channel_id] -= book.bitfinex[channel_id][index][2];
          else
          sell_total.bitfinex[channel_id] += book.bitfinex[channel_id][index][2];
          book.bitfinex[channel_id][index] = [price, count, quantity];
        } else {
          book.bitfinex[channel_id].push([price, count, quantity]);
          book.bitfinex[channel_id].sort(compare);
        }
        if(quantity > 0)
        buy_total.bitfinex[channel_id] += quantity;
        else
        sell_total.bitfinex[channel_id] += absQuant;
      } 
      else if(count == 0 && index != -1) {
        if(book.bitfinex[channel_id][index][2] > 0)
        buy_total.bitfinex[channel_id] -= book.bitfinex[channel_id][index][2];
        else
        sell_total.bitfinex[channel_id] += book.bitfinex[channel_id][index][2];
        book.bitfinex[channel_id].splice(index, 1);
      }
      // console.log(book.bitfinex[channel_id]);
      // console.log(price, quantity, book.bitfinex[channel_id].length, book.bitfinex[channel_id].length);

      // quantity > 0 ? updateBook(channel_id, "buy") : updateBook(channel_id, "sell");
      // updateBook(channel_id);
      let s_total = sell_total.bitfinex[channel_id];
      let b_total = buy_total.bitfinex[channel_id];
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
        if(sb_ratio > sensitivity && (!wall.bitfinex[channel_id].sell)) { // || sb_ratio > wall.bitfinex[channel_id].sell)) {
          // console.log("buy:",symbol, 1/sb_ratio, s_total+"/"+b_total);
          // console.log(book.bitfinex[channel_id]);
          messageObj.side = "Sell";
          messageObj.quantity = s_total;
          messageObj.size = sb_ratio;
          wall.bitfinex[channel_id] = {
            sell: sb_ratio,
            buy: false
          };
          if(alerts)
            message(messageObj);
        }
        else if((1/sb_ratio) > sensitivity && (!wall.bitfinex[channel_id].buy)) { // || (1/sb_ratio) > wall.bitfinex[channel_id].buy)) {
          // console.log("buy:",symbol, 1/sb_ratio, s_total+"/"+b_total);
          // console.log(book.bitfinex[channel_id]);
          messageObj.side = "Buy";
          messageObj.size = 1/sb_ratio;
          messageObj.quantity = b_total;
          wall.bitfinex[channel_id] = {
            sell: false,
            buy: 1/sb_ratio
          };
          if(alerts)
            message(messageObj);
        } 
        if(wall.bitfinex[channel_id].sell && sb_ratio < sensitivity && sb_ratio >= 1) {
          wall.bitfinex[channel_id].sell = false;
          // console.log(symbol+" sell volume decreased");
          messageObj.event = "WD";
          messageObj.side = "Sell";
          if(alerts)
          message(messageObj);
        }
        if(wall.bitfinex[channel_id].buy && 1/sb_ratio < sensitivity && 1/sb_ratio >= 1) {
          wall.bitfinex[channel_id].buy = false; 
          // console.log(symbol+" buy volume decreased");
          messageObj.event = "WD";
          messageObj.side = "Buy";
          if(alerts)
          message(messageObj);
        }
      }
    } else if(typeof order[1] != "string" && order[1][0][0] != undefined) {
      book.bitfinex[channel_id] = order[1];
      wall.bitfinex[channel_id] = {
        sell: false,
        buy: false
      };
      updateBook(channel_id);
    }
  }
  
}

const binance = (order) => {
  let symbol = order.s;
  let currency = symbol.substring(0, 3);
  let U = order.U;
  let u = order.u;
  let bids = order.b;
  let asks = order.a;
  let outlier = 0;
  
  // console.log(u >= book.binance[symbol].lastUId);

  if(book.binance[symbol] != undefined && u >= book.binance[symbol].lastUId + 1 
      && (first[symbol] || U == book.binance[symbol].lastUId + 1)) {
    first[symbol] = false;
    try {
      if(book.binance[symbol].bids.length > 3)
        outlier = parseFloat(book.binance[symbol].bids[book.binance[symbol].bids.length-1][0]) - (23*sd(book.binance[symbol].bids));
      else
        throw new Error("");
    } catch(e) {
      outlier = parseFloat(book.binance[symbol].asks[0][0]) - (23*sd(book.binance[symbol].asks));;
    }
    // console.log("bids", symbol, outlier)
    // console.log(book.binance[symbol]);
    bids.forEach((pricePoint) => {
      let index = book.binance[symbol].bids.findIndex(x => x[0] == pricePoint[0]);
      if(index != -1) {
        buy_total.binance[symbol] -= parseFloat(book.binance[symbol].bids[index][1]);
        // console.log(parseFloat(pricePoint[0]), parseFloat(pricePoint[1]), book.binance[symbol].bids.length, book.binance[symbol].asks.length);
        // console.log(book.binance[symbol]);
        if(parseFloat(pricePoint[1]) != 0) {
          book.binance[symbol].bids[index][1] = pricePoint[1];
          buy_total.binance[symbol] += parseFloat(pricePoint[1]);
        } else {
          book.binance[symbol].bids.splice(index, 1);
        }
      } 
      else if(parseFloat(pricePoint[1]) != 0 && parseFloat(pricePoint[0]) > outlier) {
        book.binance[symbol].bids.push(pricePoint);
        book.binance[symbol].bids.sort(compare);
        buy_total.binance[symbol] += parseFloat(pricePoint[1]);
        if(book.binance[symbol].bids.length > 20) {
          buy_total.binance[symbol] -= parseFloat(book.binance[symbol].bids[0][1]);
          book.binance[symbol].bids.splice(0, 1);
        }
      }    
    });
    
    try{
      if(book.binance[symbol].asks.length > 3)
        outlier = parseFloat(book.binance[symbol].asks[0][0]) + (23*sd(book.binance[symbol].asks));
      else
        throw new Error("");
    } catch(e) {
      // console.log(book.binance[symbol]);
      outlier = parseFloat(book.binance[symbol].bids[book.binance[symbol].bids.length-1][0]) + (24*sd(book.binance[symbol].bids));
    }
    // console.log("asks", symbol, outlier)
    // console.log(book.binance[symbol]);
    asks.forEach((pricePoint) => {
      let index = book.binance[symbol].asks.findIndex(x => x[0] == pricePoint[0]);
      if(index != -1) {
        sell_total.binance[symbol] -= parseFloat(book.binance[symbol].asks[index][1]);
        if(parseFloat(pricePoint[1]) != 0) {
          book.binance[symbol].asks[index][1] = pricePoint[1];
          sell_total.binance[symbol] += parseFloat(pricePoint[1]);
        } else {
          book.binance[symbol].asks.splice(index, 1);
        }
      } 
      else if(parseFloat(pricePoint[1]) != 0 && parseFloat(pricePoint[0]) < outlier) {
        book.binance[symbol].asks.push(pricePoint);
        book.binance[symbol].asks.sort(compare);
        sell_total.binance[symbol] += parseFloat(pricePoint[1]);
        if(book.binance[symbol].asks.length > 20) {
          sell_total.binance[symbol] -= parseFloat(book.binance[symbol].asks[20][1]);
          book.binance[symbol].asks.splice(20, 1);
        }
      }
    
    });

    book.binance[symbol].lastUId = u;
    
    let s_total = sell_total.binance[symbol];
    let b_total = buy_total.binance[symbol];
    let bPrice = 0;
    let aPrice = 0;
    // try {
    //   bPrice = parseFloat(book.binance[symbol].bids[book.binance[symbol].bids.length-1][0]);
    // } catch(e) {
    //   bPrice = parseFloat(book.binance[symbol].asks[0][0]);
    // }
    try {
      aPrice = parseFloat(book.binance[symbol].asks[0][0]);
    } catch(e) {
      aPrice = parseFloat(book.binance[symbol].bids[book.binance[symbol].bids.length-1][0]);
    }
    // console.log(symbol, s_total, b_total, aPrice, bPrice);
    // console.log(book.binance[symbol]);
    let book_length_check = Math.abs(book.binance[symbol].bids.length - book.binance[symbol].asks.length) < 3;
    if(book_length_check && ((s_total*aPrice > min_worth[currency]) || (b_total*aPrice > min_worth[currency]))) {
      let sb_ratio = s_total/b_total;
      // console.log(symbol, sb_ratio, s_total/b_total);
      let messageObj = {
        event: "VOLUME",
        side: "",
        symbol,
        size: 0,
        exchange: "Binance"
      }
      if(sb_ratio > sensitivity && (!wall.binance[symbol].sell)) { // || sb_ratio > wall.binance[symbol].sell)) {
        // console.log("sell:", symbol, sb_ratio, s_total+"/"+b_total);
        // console.log(book.binance[symbol]);
        messageObj.side = "Sell";
        messageObj.size = sb_ratio;
        messageObj.quantity = s_total;
        wall.binance[symbol] = {
          sell: sb_ratio,
          buy: false
        };
        if(alerts)
          message(messageObj);
      }
      else if((1/sb_ratio) > sensitivity && (!wall.binance[symbol].buy)) { // || (1/sb_ratio) > wall.binance[symbol].buy)) {
        // console.log("buy:",symbol, 1/sb_ratio, s_total+"/"+b_total);
        // console.log(book.binance[symbol]);
        messageObj.side = "Buy";
        messageObj.size = 1/sb_ratio;
        messageObj.quantity = b_total;
        wall.binance[symbol] = {
          sell: false,
          buy: 1/sb_ratio
        };
        if(alerts)
          message(messageObj);
      } 
      if(wall.binance[symbol].sell && sb_ratio < sensitivity && sb_ratio >= 1) {
        // console.log(symbol+" sell volume decreased");
        wall.binance[symbol].sell = false;
        messageObj.event = "WD";
        messageObj.side = "Sell";
        if(alerts)
        message(messageObj);
      }
      if(wall.binance[symbol].buy && 1/sb_ratio < sensitivity && 1/sb_ratio >= 1) {
        // console.log(symbol+" buy volume decreased");
        wall.binance[symbol].buy = false; 
        messageObj.event = "WD";
        messageObj.side = "Buy";
        if(alerts)
        message(messageObj);
      }
    }
  }
}

module.exports = {bitfinex, binance, min_worth, sensitivity};