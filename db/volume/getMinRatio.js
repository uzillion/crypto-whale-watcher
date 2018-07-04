const db = require('../index');

let QUERY = 'SELECT ratio FROM MinVolumeRatio';

const getMinRatio = () => {
  return db.one(QUERY)
    .catch((err) => console.log(err.stack));
    // .then((data) => {
      // statement.get().ratio;
    // });
}

module.exports = getMinRatio;