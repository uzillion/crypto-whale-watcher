const db = require('../index');

let QUERY = 'UPDATE MinVolumeRatio SET ratio=$1';

const setMinRatio = (ratio) => {
  return db.query(QUERY, ratio)
    .catch((err) => {
      console.error("Failed to update MinVolumeRatio.");
      console.error(err.stack);
    });
}

module.exports = setMinRatio;