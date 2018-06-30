const fs = require('fs');

const updateLimits = () => {
  fs.readdir('./core/trades/', (err, files) => {
    if(err)
      console.log(err);
    else {
      files.forEach((file) => {
        if(file != 'index.js') {
          require('../core/trades/'+file).updateLimits();
        }
      });
    }
  });

  fs.readdir('./core/orders/', (err, files) => {
    if(err)
      console.log(err);
    else {
      files.forEach((file) => {
        if(file != 'index.js') {
          require('../core/orders/'+file).updateLimits();
        }
      });
    }
  });
} 

module.exports = updateLimits;