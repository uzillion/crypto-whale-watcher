const db = require('../index');

let statement = db.prepare('UPDATE VolumeFilter SET percent=?');

const setVolFilter = (percent) => {
  statement.run(percent);
}

module.exports = setVolFilter;