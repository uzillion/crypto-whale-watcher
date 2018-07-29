module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  // PARSE_EMODE: "",
  CHAT_ID: process.env.CHAT_ID,
  TESTING: (process.env.TESTING === 'true'),  // Ignore, unless you want to send alerts to a seperate channel while testing, set this to true
  TEST_CHAT_ID: (process.env.TEST_CHAT_ID?process.env.TEST_CHAT_ID:""), // Used when "TESTING" is set to true.
  
  currencies: [
    "BTCUSD", "ETHUSD", "EOSUSD", "LTCUSD", // USD Comparative (use USD even for USDT)
    "ETHBTC", "EOSBTC", "LTCBTC",  // BTC Comparative
  ],

  trade: {
    alerts: true,
    min_worth: {  // Used while migrating alert limits to the database
      default: 70000, // Default value for when specific value is not specified below
      BTC: 100000,
      LTC: 45000 ,
      ETH: 65000,
      EOS: 60000
    }
  },
  
  order: {
    alerts: true,
    min_worth: {  // Used while migrating alert limits to the database
      default: 7000000, // Default value for when specific value is not specified below
      BTC: 1000000,
      LTC: 500000
    }
  }
}