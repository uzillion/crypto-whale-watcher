const db = require('../index');

let QUERY = 'SELECT * FROM MinTradeWorth';

const convert = (data) => {
  let obj = {};

  data.forEach((row) => {
    obj[row.symbol.trim()] = row.worth;
  });

  return obj;
}

const getMinWorth = () => {
  return db.many(QUERY)
    .then((rows) => {
      return convert(rows);
    }).catch((err) => {
      console.error(err.stack);
    });
}

module.exports = getMinWorth;