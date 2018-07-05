module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  // PARSE_EMODE: "",
  CHAT_ID: process.env.CHAT_ID,
  TESTING: (process.env.TESTING === 'true'),  // Ignore, unless you want to send alerts to a seperate channel while testing, set this to true
  TEST_CHAT_ID: process.env.TEST_CHAT_ID, // Used when "TESTING" is set to true.
  trade: {
    alerts: true
  },
  volume: {
    alerts: true
  }

}