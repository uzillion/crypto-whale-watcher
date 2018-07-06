const db = require('../index');

let QUERY = 'UPDATE MinVolumeRatio SET ratio=$1';

const setMinRatio = (ratio) => {
  return db.query(QUERY, ratio)
    .catch((err) => {
      throw err;
    });
}

module.exports = setMinRatio;