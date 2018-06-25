const db = require('../index');

let statement = db.prepare('UPDATE VolumeWorth SET worth=? WHERE symbol=?');

const setMinWorth = (symbol, worth) => {
  statement.run([worth, symbol]);
}

module.exports = setMinWorth;