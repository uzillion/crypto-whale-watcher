const db = require('../index');

let QUERY = 'UPDATE VolumeFilter SET percent=$1';

const setVolFilter = (percent) => {
  return db.query(QUERY, [percent])
    .catch((err) => console.log(err.stack));
}

module.exports = setVolFilter;