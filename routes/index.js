var express = require('express');
var router = express.Router();
const updateLimits = require('../lib/updateLimits');
let message = require('../lib/message');

let trade = require('../db/trade');
let volume = require('../db/volume');

const changeLimits = async (body) => {
  if(body.btc > 35000)
    await trade.setMinWorth('BTC', body.btc);
  if(body.ltc > 35000)
    await trade.setMinWorth('LTC', body.ltc);
  if(body.eos > 35000)
    await trade.setMinWorth('EOS', body.eos);
  if(body.eth > 35000)
    await trade.setMinWorth('ETH', body.eth);
  if(body.btc_vol >= 500000)
    await volume.setMinWorth('BTC', body.btc_vol);
  if(body.ltc_vol >= 400000)
    await volume.setMinWorth('LTC', body.ltc_vol);
  if(body.eos_vol >= 400000)
    await volume.setMinWorth('EOS', body.eos_vol);
  if(body.eth_vol >= 500000)
   await volume.setMinWorth('ETH', body.eth_vol);
  if(body.ratio >= 1.5)
    await volume.setMinRatio(body.ratio);

  await trade.setVolFilter(body.portion);
  updateLimits();
} 

/* GET home page. */
router.get('/', function(req, res) {
  let client_obj = { 
    title: 'Whale Tracker', 
    min: {}, 
    portion: null,
    vol: {},
    vol_ratio: null
  }

  let p1 = trade.getMinWorth().then((data) => {
    client_obj.min = data;
  });
  
  let p2 = trade.getVolFilter().then((data) => {
    client_obj.portion = data.percent;
  });
  
  let p3 = volume.getMinWorth().then((data) => {
    client_obj.vol = data;
  });
  
  let p4 = volume.getMinRatio().then((data) => {
    client_obj.vol_ratio = data.ratio;
  });

  Promise.all([p1, p2, p3, p4]).then(() => {
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
