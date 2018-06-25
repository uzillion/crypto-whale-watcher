const db = require('../index');

let statement = db.prepare('SELECT * FROM MinVolumeRatio');

const getMinRatio = () => {
  return statement.get().ratio;
}

module.exports = getMinRatio;