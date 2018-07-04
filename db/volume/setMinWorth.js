const db = require('../index');

let QUERY = 'UPDATE VolumeWorth SET worth=$1 WHERE symbol=$2';

const setMinWorth = (symbol, worth) => {
  return db.query(QUERY, [worth, symbol])
    .catch((err) => console.log(err.stack));
}

module.exports = setMinWorth;