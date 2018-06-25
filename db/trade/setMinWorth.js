const db = require('../index');

let statement = db.prepare('UPDATE TradeWorth SET worth=? WHERE symbol=?');

const setMinWorth = (symbol, worth) => {
  statement.run([worth, symbol]);
}

module.exports = setMinWorth;