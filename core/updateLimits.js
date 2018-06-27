const fs = require('fs');

const updateLimits = () => {
  fs.readdir('./core/trade/', (err, files) => {
    if(err)
      console.log(err);
    else {
      files.forEach((file) => {
        if(file != 'index.js') {
          require('../core/trade/'+file).updateLimits();
        }
      });
    }
  });

  fs.readdir('./core/wall/', (err, files) => {
    if(err)
      console.log(err);
    else {
      files.forEach((file) => {
        if(file != 'index.js') {
          require('../core/wall/'+file).updateLimits();
        }
      });
    }
  });
} 

module.exports = updateLimits;