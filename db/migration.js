const sqlite3 = require("better-sqlite3");
const db = sqlite3('./db/whale-watch.db');

const createTables = async () => {

  let tablesCreated = new Promise((resolve, reject) => {
    try {
      db.prepare(`CREATE TABLE TradeWorth(
        symbol char(10) PRIMARY KEY,
        worth int
      )`).run()
      
      db.prepare(`CREATE TABLE VolumeWorth(
        symbol char(10) PRIMARY KEY,
        worth int
      )`).run();
      
      db.prepare(`CREATE TABLE VolumeFilter(
        percent real
      )`).run();
      
      db.prepare(`CREATE TABLE MinVolumeRatio(
        ratio real
      )`).run();

      resolve();
    } catch(e) {
      reject("Error creating tables. Try deleting db file and then retry.");
    }

  });
  
  await tablesCreated;
}


createTables().then(() => {
  db.prepare(`INSERT INTO TradeWorth (symbol, worth) VALUES
    (?, ?),
    (?, ?),
    (?, ?),
    (?, ?)
  `).run(['BTC', 70000, 'ETH', 50000, 'LTC', 40000, 'EOS', 40000]);

  db.prepare(`INSERT INTO VolumeWorth (symbol, worth) VALUES
    (?, ?),
    (?, ?),
    (?, ?),
    (?, ?)
  `).run(['BTC', 1000000, 'ETH', 600000, 'LTC', 500000, 'EOS', 500000]);

  db.prepare(`INSERT INTO VolumeFilter (percent) VALUES
    (?)
  `).run(0);

  db.prepare(`INSERT INTO MinVolumeRatio (ratio) VALUES
    (?)
  `).run(2.5);
}).catch((err) => console.log("Database already exists"));
