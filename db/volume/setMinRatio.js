const db = require('../index');

let statement = db.prepare('UPDATE MinVolumeRatio SET ratio=?');

const setMinRatio = (ratio) => {
  statement.run(ratio);
}

module.exports = setMinRatio;