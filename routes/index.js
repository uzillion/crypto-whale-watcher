var express = require('express');
var router = express.Router();
let trade = require('../bin/trade');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Whale Tracker', min: trade.min_quant, portion: trade.portion_size});
});

router.post('/', function(req, res) {
  if(req.body.btc > 7)
    trade.min_quant["BTC"] = req.body.btc;
  if(req.body.ltc > 350)
    trade.min_quant["LTC"] = req.body.ltc;
  if(req.body.eos > 3000)
    trade.min_quant["EOS"] = req.body.eos;
  if(req.body.eth > 100)
    trade.min_quant["ETH"] = req.body.eth;

  trade.portion_size = req.body.portion / 100;

  res.redirect("/");
});

module.exports = router;
