const db = require('../index');

let QUERY = `SELECT percent FROM VolumeFilter WHERE type='trade'`;

const getVolFilter = () => {
  return db.one(QUERY)
    .then((data) => {return data.percent})
    .catch((err) => {
      throw err;
    });
}

module.exports = getVolFilter;