const fs = require('fs');

const updateLimits = () => {
  fs.readdir('./lib/trades/', (err, files) => {
    if(err)
      console.log(err);
    else {
      files.forEach((file) => {
        if(file != 'index.js') {
          require('../lib/trades/'+file).updateLimits();
        }
      });
    }
  });

  fs.readdir('./lib/orders/', (err, files) => {
    if(err)
      console.log(err);
    else {
      files.forEach((file) => {
        if(file != 'index.js') {
          require('../lib/orders/'+file).updateLimits();
        }
      });
    }
  });
} 

module.exports = updateLimits;