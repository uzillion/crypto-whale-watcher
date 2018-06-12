const request = require('request-promise-native');

const build = (messageObj) => {
  event = messageObj.event;
  symbol = messageObj.symbol;
  quantity = messageObj.quantity;
  price = messageObj.price;
  exchange = messageObj.exchange;

  let encoded_message = "";
  if(exchange.toLowerCase() == "binance")
    encoded_message = encodeURIComponent(`${event}:\nBTC/USDT (${exchange})\n${quantity} at $${price}`);
  else
    if(quantity < 0)
      encoded_message = encodeURIComponent(`${event}:\nBTC/USD (${exchange})\nSold ${quantity*-1} at $${price}`);
    else
      encoded_message = encodeURIComponent(`${event}:\nBTC/USD (${exchange})\nBought ${quantity} at $${price}`);
  
  var chatOptions = {
    uri: `https://api.telegram.org/bot596257066:AAGkmCVBSgYx0FvPV-OElc7ZwTypnLj4ipw/sendMessage?chat_id=-1001236925237&text=${encoded_message}`,
    headers: {
        'User-Agent': 'Request-Promise'
    },
    json: true
  };
  
  request(chatOptions)
    .then(function (res) {
        console.log(res.result.text+" sent");
    })
    .catch(function (err) {
      console.log(JSON.stringify(err.body));
    });
}

module.exports = build;