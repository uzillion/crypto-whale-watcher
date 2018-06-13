const request = require('request-promise-native');
let prev_msg_id = 0;
let prev_to_id = "";
let prev_mo_id = "";
let prev_quantity = 0;

const sendMessage = (chatOptions) => {
  return request(chatOptions)
    .then(function (res) {
        return res;
    }).catch(function (err) {
      console.log(JSON.stringify(err.body));
    });
}

const build = (messageObj) => {
  let event = messageObj.event;
  let symbol = messageObj.symbol;
  let quantity = messageObj.quantity;
  let price = messageObj.price;
  let exchange = messageObj.exchange;
  let isAggregate = messageObj.isAggregate;
  let to_id = messageObj.taker_order_id;
  let mo_id = messageObj.maker_order_id;
  let encoded_message = "";
  let aggr_msg = "";
  let order_ids = "";
  let special_msg = "";

  if(exchange == 'gdax') {
    let taker = "";
    let maker = "";
    if(quantity < 0) {
      taker = "seller";
      maker = "buyer";
    } else {
      taker = "buyer";
      maker = "seller";
    }
    order_ids = `\n${taker}_order_Id: ${to_id.substring(to_id.length - 4)}\n${maker}_order_Id: ${mo_id.substring(mo_id.length - 4)}`;
    aggr_msg = isAggregate?"\n**Aggregated**":"";
    special_msg = order_ids + aggr_msg;
  }
  if(quantity < 0)
    encoded_message = encodeURIComponent(`${event}:\n${symbol} (${exchange})\nSold ${quantity*-1} at $${price}${special_msg}`);
  else
    encoded_message = encodeURIComponent(`${event}:\n${symbol} (${exchange})\nBought ${quantity} at $${price}${special_msg}`);
  
  var chatOptions = {
    uri: `https://api.telegram.org/bot596257066:AAGkmCVBSgYx0FvPV-OElc7ZwTypnLj4ipw/sendMessage?chat_id=-1001236925237&text=${encoded_message}`,
    headers: {
        'User-Agent': 'Request-Promise'
    },
    json: true
  };

  if(to_id == prev_to_id || mo_id == prev_mo_id) {
    if(quantity > prev_quantity) {
      chatOptions.uri = `https://api.telegram.org/bot596257066:AAGkmCVBSgYx0FvPV-OElc7ZwTypnLj4ipw/editMessageText?chat_id=-1001236925237&message_id=${prev_msg_id}&text=${encoded_message}`;
      sendMessage(chatOptions)
        .then((res) => {
          if(res.ok) {
            prev_quantity = quantity;
            prev_msg_id = res.result.message_id;
            console.log(res.result.text+" sent");
          }
        });
    }
  } else {
    sendMessage(chatOptions)
      .then((res) => {
        if(res.ok) {
          prev_quantity = quantity;
          prev_msg_id = res.result.message_id;
          console.log(res.result.text+" sent");
        }
      });
  }
}

module.exports = build;