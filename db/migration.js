/**
* Run when "npm install" or "npm db:migrate" is run.
* Migrates default data into the newly created tables. 
*/

const db = require('./index');

const createTables = async () => {
  
  try {
    let p1 = db.query(`CREATE TABLE MinTradeWorth(
      symbol char(10) PRIMARY KEY,
      worth int
    )`)
    
    let p2 = db.query(`CREATE TABLE MinOrderWorth(
      symbol char(10) PRIMARY KEY,
      worth int
    )`);
    
    let p3 = db.query(`CREATE TABLE VolumeFilter(
      type char(10) PRIMARY KEY, 
      percent real
    )`);
    
    let p4 = db.query(`CREATE TABLE MinVolumeRatio(
      ratio real
    )`);

    await Promise.all([p1, p2, p3, p4]);
  } catch(e) {
    throw e;
  }
}

const insertData = async () => {
  let p1 = db.query(`INSERT INTO MinTradeWorth (symbol, worth) VALUES
  ($1, $2),
  ($3, $4),
  ($5, $6),
  ($7, $8)
  `,['BTC', 70000, 'ETH', 50000, 'LTC', 40000, 'EOS', 40000]);
  
  let p2 = db.query(`INSERT INTO MinOrderWorth (symbol, worth) VALUES
  ($1, $2),
  ($3, $4),
  ($5, $6),
  ($7, $8)
  `,['BTC', 1000000, 'ETH', 600000, 'LTC', 500000, 'EOS', 500000]);
  
  let p3 = db.query(`INSERT INTO VolumeFilter (type, percent) VALUES
  ($1, $2),
  ($3, $4)
  `,['trade', 0, 'order', 0]);
  
  let p4 = db.query(`INSERT INTO MinVolumeRatio (ratio) VALUES
  ($1)
  `,[2.5]);

  await Promise.all([p1, p2, p3, p4]);
}


db.query('DROP SCHEMA public CASCADE')
  .then(() => {
    db.query('CREATE SCHEMA public')
      .then(() => {
        createTables().then(() => {
          insertData();
        }).catch((err) => {
          console.error("Migration failed");
          throw err;
        });
      })
  })
