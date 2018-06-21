var express = require('express');
var router = express.Router();
let trade = require('../bin/trade');
let wall = require('../bin/wall');
let message = require('../bin/message');

/* GET home page. */
router.get('/', function(req, res) {
  let client_obj = { 
    title: 'Whale Tracker', 
    min: trade.min_cost, 
    portion: trade.portion_size,
    vol: wall.min_worth,
    vol_ratio: wall.sensitivity
  }
  res.render('index', client_obj);
});

router.post('/', function(req, res) {
  let messageObj = {
    event: 'limit-change',
  }
  message(messageObj);

  if(req.body.btc > 35000)
    trade.min_cost["BTC"] = req.body.btc;
  if(req.body.ltc > 35000)
    trade.min_cost["LTC"] = req.body.ltc;
  if(req.body.eos > 35000)
    trade.min_cost["EOS"] = req.body.eos;
  if(req.body.eth > 35000)
    trade.min_cost["ETH"] = req.body.eth;
  if(req.body.btc_vol >= 500000)
    wall.min_worth["BTC"] = req.body.btc_vol;
  if(req.body.ltc_vol >= 400000)
    wall.min_worth["LTC"] = req.body.ltc_vol;
  if(req.body.eos_vol >= 400000)
    wall.min_worth["EOS"] = req.body.eos_vol;
  if(req.body.eth_vol >= 500000)
    wall.min_worth["ETH"] = req.body.eth_vol;
  if(req.body.ratio >= 1.5)
    wall.sensitivity = req.body.ratio;

  trade.portion_size = req.body.portion / 100;

  res.redirect("/");
});

module.exports = router;
