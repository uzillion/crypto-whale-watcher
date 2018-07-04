const db = require('../index');

let QUERY = 'SELECT percent FROM VolumeFilter';

const getVolFilter = () => {
  return db.one(QUERY)
    .catch((err) => console.log(err.stack));
}

module.exports = getVolFilter;