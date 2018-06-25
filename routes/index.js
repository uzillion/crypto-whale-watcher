var express = require('express');
var router = express.Router();
let wall = require('../app_modules/wall');
let message = require('../app_modules/message');

let trade = require('../db/trade');
let volume = require('../db/volume');

/* GET home page. */
router.get('/', function(req, res) {
  let client_obj = { 
    title: 'Whale Tracker', 
    min: trade.getMinWorth(), 
    portion: trade.getVolFilter(),
    vol: volume.getMinWorth(),
    vol_ratio: volume.getMinRatio()
  }
  res.render('index', client_obj);
});

router.post('/', function(req, res) {
  let messageObj = {
    event: 'limit-change',
  }
  message(messageObj);

  if(req.body.btc > 35000)
    trade.setMinWorth('BTC', req.body.btc);
  if(req.body.ltc > 35000)
    trade.setMinWorth('LTC', req.body.ltc);
  if(req.body.eos > 35000)
    trade.setMinWorth('EOS', req.body.eos);
  if(req.body.eth > 35000)
    trade.setMinWorth('ETH', req.body.eth);
  if(req.body.btc_vol >= 500000)
    volume.setMinWorth('BTC', req.body.btc_vol);
  if(req.body.ltc_vol >= 400000)
    volume.setMinWorth('LTC', req.body.ltc_vol);
  if(req.body.eos_vol >= 400000)
    volume.setMinWorth('EOS', req.body.eos_vol);
  if(req.body.eth_vol >= 500000)
    volume.setMinWorth('ETH', req.body.eth_vol);
  if(req.body.ratio >= 1.5)
    volume.setMinRatio(req.body.ratio);

  trade.setVolFilter(req.body.portion);

  res.redirect("/");
});

module.exports = router;
