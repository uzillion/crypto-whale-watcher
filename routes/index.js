var express = require('express');
var router = express.Router();
const updateLimits = require('../lib/updateLimits');
let message = require('../lib/message');
let {getCurrencies} = require('../lib/pairs');

let trades = require('../db/trades');
let orders = require('../db/orders');

const changeLimits = async (body) => {
  let trade_symbol = "";
  let new_trade_limit = 0;
  let order_symbol = "";
  let new_order_limit = 0;
  
  Object.keys(body).forEach((key) => {
    if(/trade_limit_[A-Z]+/.test(key)) {
      new_trade_limit = parseInt(body[key]);
      trade_symbol = key.replace("trade_limit_", "");
    }
    else if(/order_limit_[A-Z]+/.test(key)) {
      new_order_limit = parseInt(body[key]);
      order_symbol = key.replace("order_limit_", "");
    }
  });

  console.log(body.vol_ratio);

  if(new_trade_limit >= 35000)
    await trades.setMinWorth(trade_symbol, body["trade_limit_"+trade_symbol]);
  
  if(new_order_limit >= 500000)
    await orders.setMinWorth(order_symbol, body["order_limit_"+order_symbol]);
  
  if(parseFloat(body.vol_ratio) >= 1.5)
    await orders.setMinRatio(body.vol_ratio);

  await trades.setVolFilter(parseFloat(body.trade_portion));
  // await orders.setVolFiler(body.order_portion);
  updateLimits();
} 

/* GET home page. */
router.get('/', function(req, res) {
  let client_obj = { 
    title: 'Whale Tracker', 
    currencies: getCurrencies(),
    trad_min: {}, 
    trade_portion: null,
    order_min: {},
    vol_ratio: null,
    order_portion: null
  }

  let p1 = trades.getMinWorth().then((data) => {
    client_obj.trade_min = data;
  });
  
  let p2 = trades.getVolFilter().then((data) => {
    client_obj.trade_portion = data;
  });
  
  let p3 = orders.getMinWorth().then((data) => {
    client_obj.order_min = data;
  });
  
  let p4 = orders.getMinRatio().then((data) => {
    client_obj.vol_ratio = data;
  });

  let p5 = orders.getVolFilter().then((data) => {
    client_obj.order_portion = data;
  });

  Promise.all([p1, p2, p3, p4, p5]).then(() => {
    res.render('index', client_obj);
  });
});

router.post('/', function(req, res) {
  let messageObj = {
    event: 'limit-change',
  }
  message(messageObj);
  
  changeLimits(req.body).then(() => {
    res.redirect("/");
  });
});

module.exports = router;
