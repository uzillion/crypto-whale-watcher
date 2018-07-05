const db = require('../index');

let QUERY = 'UPDATE TradeWorth SET worth=$1 WHERE symbol=$2';

/**
 * 
 * @param {string} symbol 
 * @param {number} worth - Integer Value
 */
const setMinWorth = (symbol, worth) => {
  return db.query(QUERY, [worth, symbol])
    .catch((err) => console.log(err.stack));
}

module.exports = setMinWorth;