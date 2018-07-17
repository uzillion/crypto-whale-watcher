var express = require('express');
var router = express.Router();
const updateLimits = require('../lib/updateLimits');
let message = require('../lib/message');

let trades = require('../db/trades');
let orders = require('../db/orders');

const changeLimits = async (body) => {
  if(body.btc > 35000)
    await trades.setMinWorth('BTC', body.btc);
  if(body.ltc > 35000)
    await trades.setMinWorth('LTC', body.ltc);
  if(body.eos > 35000)
    await trades.setMinWorth('EOS', body.eos);
  if(body.eth > 35000)
    await trades.setMinWorth('ETH', body.eth);
  if(body.btc_vol >= 500000)
    await orders.setMinWorth('BTC', body.btc_vol);
  if(body.ltc_vol >= 400000)
    await orders.setMinWorth('LTC', body.ltc_vol);
  if(body.eos_vol >= 400000)
    await orders.setMinWorth('EOS', body.eos_vol);
  if(body.eth_vol >= 500000)
   await orders.setMinWorth('ETH', body.eth_vol);
  if(body.ratio >= 1.5)
    await orders.setMinRatio(body.ratio);

  await trades.setVolFilter(body.trade_portion);
  // await orders.setVolFiler(body.order_portion);
  updateLimits();
} 

/* GET home page. */
router.get('/', function(req, res) {
  let client_obj = { 
    title: 'Whale Tracker', 
    min: {}, 
    trade_portion: null,
    vol: {},
    vol_ratio: null,
    order_portion: null
  }

  let p1 = trades.getMinWorth().then((data) => {
    client_obj.min = data;
  });
  
  let p2 = trades.getVolFilter().then((data) => {
    client_obj.trade_portion = data;
  });
  
  let p3 = orders.getMinWorth().then((data) => {
    client_obj.vol = data;
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
