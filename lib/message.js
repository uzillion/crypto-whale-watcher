const request = require('request-promise-native');
const config = require('../config');
let prev_msg_id = 0;
let prev_to_id = "";
let prev_mo_id = "";
let prev_quantity = 0;
// let test = false;

let CHAT_ID = config.CHAT_ID;

const sendMessage = (chatOptions) => {
  return request(chatOptions)
  .catch(function (err) {
    console.log("Main:", err.message);
  });
}

const build = (messageObj) => {
  let event = messageObj.event;
  let symbol = messageObj.symbol;
  let quantity = messageObj.quantity;
  let price = messageObj.price;
  let exchange = messageObj.exchange;
  let to_id = undefined;
  let mo_id = undefined;
  let isAggregate = messageObj.isAggregate;
  let encoded_message = "";
  let aggr_msg = "";
  let order_ids = "";
  let special_msg = "";
  
  if(exchange == 'gdax') {
    to_id = messageObj.taker_order_id;
    mo_id = messageObj.maker_order_id;
    let taker = "";
    let maker = "";
    if(quantity < 0) {
      taker = "seller";
      maker = "buyer";
    } else {
      taker = "buyer";
      maker = "seller";
    }
    order_ids = `\n${taker}-orderId: ${to_id.substring(to_id.length - 4)}\n${maker}-orderId: ${mo_id.substring(mo_id.length - 4)}`;
    aggr_msg = isAggregate?"\n**Aggregated**":"";
    special_msg = order_ids + aggr_msg;
  }
  
  if(event == "VOLUME") {
    let type = messageObj.type;    
    let side = messageObj.side;
    let size = Math.round(messageObj.size);
    if(typeof type == "object") {
      special_msg = "(" + type[1] + " orders placed at $" + type[0] + ")\n";
    } 
    encoded_message = encodeURIComponent(`*VOLUME:*\n${symbol} (${exchange})\n${special_msg}${side} volume is of ${quantity}, which is around ${size} times bigger than counterpart`);

  }
  else if(event == "TRADE") {
    if(quantity < 0)
      encoded_message = encodeURIComponent(`*TRADE:*\n${symbol} (${exchange})\nSold ${quantity*-1} at $${price}${special_msg}`);
    else
      encoded_message = encodeURIComponent(`*TRADE:*\n${symbol} (${exchange})\nBought ${quantity} at $${price}${special_msg}`);
  }
  else if(event == "limit-change") {
    encoded_message = encodeURIComponent('*Limit change requested.*');
  } 
  else if(event == "WD") {
    let side = messageObj.side;
    encoded_message = encodeURIComponent(`*VOLUME:*\n${symbol} (${exchange})\n${side} volume is down compared to before`);
  }
  
  if(config.TESTING)
    CHAT_ID = config.TEST_CHAT_ID;

  var chatOptions = {
    uri: `https://api.telegram.org/bot${config.BOT_TOKEN}/sendMessage?parse_mode=Markdown&chat_id=${CHAT_ID}&text=${encoded_message}`,
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true
  };
  
  if(to_id == prev_to_id || mo_id == prev_mo_id) {
    if(quantity > prev_quantity) {
      chatOptions.uri = `https://api.telegram.org/bot${config.BOT_TOKEN}/editMessageText?parse_mode=Markdown&chat_id=${CHAT_ID}&message_id=${prev_msg_id}&text=${encoded_message}`;
      sendMessage(chatOptions)
      .then((res) => {
        // console.log("This is res:", res);
        if(res.ok) {
          prev_msg_id = res.result.message_id;
          prev_quantity = quantity;
        } else {
          console.log("Message update failed");
        }
        // console.log(res.result.text+" updated");
      });
    }
  } else {
    // console.log(encoded_message);
    sendMessage(chatOptions)
    .then((res) => {
      if(res.ok) {
        prev_msg_id = res.result.message_id;
        prev_quantity = quantity;
      } else {
        console.log("Message sending failed");
      }
      // console.log(res.result.text+" sent");
    });
  }
  
  if(to_id != undefined && mo_id != undefined) {
    prev_to_id = to_id;
    prev_mo_id = mo_id;
  }
}

module.exports = build;