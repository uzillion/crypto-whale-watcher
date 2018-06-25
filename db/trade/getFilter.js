const db = require('../index');

let statement = db.prepare('SELECT * FROM VolumeFilter');

const getVolFilter = () => {
  return statement.get().percent;
}

module.exports = getVolFilter;