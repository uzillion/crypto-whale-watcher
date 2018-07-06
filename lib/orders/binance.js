const message = require('../message');
const request = require('request-promise-native');
const sd = require('../sd');
const alerts = require('../../config').volume.alerts;
const orders = require('../../db/orders');

let sensitivity = 100;
orders.getMinRatio().then((data) => {
  sensitivity = data;
});

let volume_filter = orders.getVolFilter();

const requestOptions = {
  uri: '',
  headers: {
    'User-Agent': 'Request-Promise'
  },
  json: true
};

const first_run = {};
const sell_total = {};
const buy_total = {};
const wall = {};
const book = {};

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

const saveBook = () => {
  ["BTCUSDT", "EOSUSDT", "ETHUSDT"].forEach((symbol) => {
    first_run[symbol] = true;
    requestOptions.uri = `https://www.binance.com/api/v1/depth?symbol=${symbol}&limit=20`;
    
    request(requestOptions)
    .then((data) => {
      book[symbol] = {};
      book[symbol].lastUId = data.lastUpdateId;
      book[symbol].bids = data.bids;
      book[symbol].asks = data.asks;
      book[symbol].bids.sort(compare);
      book[symbol].asks.sort(compare);

      // console.log(book[symbol]);
      buy_total[symbol] = 0;
      sell_total[symbol] = 0;

      book[symbol].bids.forEach((pricePoint) => {
        buy_total[symbol] += parseFloat(pricePoint[1]);
      });
      
      book[symbol].asks.forEach((pricePoint) => {
        sell_total[symbol] += parseFloat(pricePoint[1]);
      })

      ready = true;
    }).catch((err) => {console.log("Binance Order book: ", err.message)});

    wall[symbol] = {
      sell: false,
      buy: false
    };
  });
}

saveBook();

const compare = (a, b) => {
  if(typeof a == "string" && typeof b == "string")
    return parseFloat(a[0]) - parseFloat(b[0]);
  else
    return a[0] - b[0];
}

const binance = (order) => {
  let symbol = order.s;
  let currency = symbol.substring(0, 3);
  let U = order.U;
  let u = order.u;
  let bids = order.b;
  let asks = order.a;
  let outlier = 0;
  
  // console.log(u >= book[symbol].lastUId);

  if(book[symbol] != undefined && u >= book[symbol].lastUId + 1 
      && (first_run[symbol] || U == book[symbol].lastUId + 1)) {
    first_run[symbol] = false;
    try {
      if(book[symbol].bids.length > 5)
        outlier = parseFloat(book[symbol].bids[book[symbol].bids.length-1][0]) - (23*sd(book[symbol].bids));
      else
        throw new Error("");
    } catch(e) {
      outlier = parseFloat(book[symbol].asks[0][0]) - (23*sd(book[symbol].asks));;
    }
    // console.log("bids", symbol, outlier)
    // console.log(book[symbol]);
    bids.forEach((pricePoint) => {
      let index = book[symbol].bids.findIndex(x => x[0] == pricePoint[0]);
      if(index != -1) {
        buy_total[symbol] -= parseFloat(book[symbol].bids[index][1]);
        // console.log(parseFloat(pricePoint[0]), parseFloat(pricePoint[1]), book[symbol].bids.length, book[symbol].asks.length);
        // console.log(book[symbol]);
        if(parseFloat(pricePoint[1]) != 0) {
          book[symbol].bids[index][1] = pricePoint[1];
          buy_total[symbol] += parseFloat(pricePoint[1]);
        } else {
          book[symbol].bids.splice(index, 1);
        }
      } 
      else if(parseFloat(pricePoint[1]) != 0 && parseFloat(pricePoint[0]) > outlier) {
        book[symbol].bids.push(pricePoint);
        book[symbol].bids.sort(compare);
        buy_total[symbol] += parseFloat(pricePoint[1]);
        if(book[symbol].bids.length > 20) {
          buy_total[symbol] -= parseFloat(book[symbol].bids[0][1]);
          book[symbol].bids.splice(0, 1);
        }
      }    
    });
    
    try{
      if(book[symbol].asks.length > 5)
        outlier = parseFloat(book[symbol].asks[0][0]) + (23*sd(book[symbol].asks));
      else
        throw new Error("");
    } catch(e) {
      // console.log(book[symbol]);
      outlier = parseFloat(book[symbol].bids[book[symbol].bids.length-1][0]) + (24*sd(book[symbol].bids));
    }
    // console.log("asks", symbol, outlier)
    // console.log(book[symbol]);
    asks.forEach((pricePoint) => {
      let index = book[symbol].asks.findIndex(x => x[0] == pricePoint[0]);
      if(index != -1) {
        sell_total[symbol] -= parseFloat(book[symbol].asks[index][1]);
        if(parseFloat(pricePoint[1]) != 0) {
          book[symbol].asks[index][1] = pricePoint[1];
          sell_total[symbol] += parseFloat(pricePoint[1]);
        } else {
          book[symbol].asks.splice(index, 1);
        }
      } 
      else if(parseFloat(pricePoint[1]) != 0 && parseFloat(pricePoint[0]) < outlier) {
        book[symbol].asks.push(pricePoint);
        book[symbol].asks.sort(compare);
        sell_total[symbol] += parseFloat(pricePoint[1]);
        if(book[symbol].asks.length > 20) {
          sell_total[symbol] -= parseFloat(book[symbol].asks[20][1]);
          book[symbol].asks.splice(20, 1);
        }
      }
    
    });

    book[symbol].lastUId = u;
    
    let s_total = sell_total[symbol];
    let b_total = buy_total[symbol];
    let bPrice = 0;
    let aPrice = 0;
    // try {
    //   bPrice = parseFloat(book[symbol].bids[book[symbol].bids.length-1][0]);
    // } catch(e) {
    //   bPrice = parseFloat(book[symbol].asks[0][0]);
    // }
    try {
      aPrice = parseFloat(book[symbol].asks[0][0]);
    } catch(e) {
      aPrice = parseFloat(book[symbol].bids[book[symbol].bids.length-1][0]);
    }
    // console.log(symbol, s_total, b_total, aPrice, bPrice);
    // console.log(book[symbol]);
    let book_length_check = Math.abs(book[symbol].bids.length - book[symbol].asks.length) < 3;
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
      if(sb_ratio > sensitivity && (!wall[symbol].sell)) { // || sb_ratio > wall[symbol].sell)) {
        // console.log("sell:", symbol, sb_ratio, s_total+"/"+b_total);
        // console.log(book[symbol]);
        messageObj.side = "Sell";
        messageObj.size = sb_ratio;
        messageObj.quantity = s_total;
        wall[symbol] = {
          sell: sb_ratio,
          buy: false
        };
        if(alerts)
          message(messageObj);
      }
      else if((1/sb_ratio) > sensitivity && (!wall[symbol].buy)) { // || (1/sb_ratio) > wall[symbol].buy)) {
        // console.log("buy:",symbol, 1/sb_ratio, s_total+"/"+b_total);
        // console.log(book[symbol]);
        messageObj.side = "Buy";
        messageObj.size = 1/sb_ratio;
        messageObj.quantity = b_total;
        wall[symbol] = {
          sell: false,
          buy: 1/sb_ratio
        };
        if(alerts)
          message(messageObj);
      } 
      if(wall[symbol].sell && sb_ratio < sensitivity && sb_ratio >= 1) {
        // console.log(symbol+" sell volume decreased");
        wall[symbol].sell = false;
        messageObj.event = "WD";
        messageObj.side = "Sell";
        if(alerts)
        message(messageObj);
      }
      if(wall[symbol].buy && 1/sb_ratio < sensitivity && 1/sb_ratio >= 1) {
        // console.log(symbol+" buy volume decreased");
        wall[symbol].buy = false; 
        messageObj.event = "WD";
        messageObj.side = "Buy";
        if(alerts)
        message(messageObj);
      }
    }
  }
}

module.exports = {binance, updateLimits};