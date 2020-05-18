const db = require('../index');

let QUERY = `UPDATE VolumeFilter SET percent=$1 WHERE type='trade'`;

const setVolFilter = (percent) => {
  return db.query(QUERY, [percent])
    .catch((err) => {
      console.error("Failed to update VolumeFilter");
      console.error(err.stack);
    });
}

module.exports = setVolFilter;