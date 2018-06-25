const db = require('../index');

let statement = db.prepare('SELECT * FROM TradeWorth');

const convert = (data) => {
  let obj = {};

  data.forEach((row) => {
    obj[row.symbol] = row.worth;
  });

  return obj;
}

const getMinWorth = () => {
  let rows = statement.all();
  return convert(rows);
}

module.exports = getMinWorth;