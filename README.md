# Crypto Whale Watcher
[![Build Status](https://travis-ci.org/uzillion/crypto-whale-watcher.svg?branch=master)](https://travis-ci.org/uzillion/crypto-whale-watcher)

Constantly looking at the order book and depth charts of different crypto-currencies on different exchanges can be painstakingly tedious. I decided to create this app to simultaneously monitor different exchanges and currencies without being bothered by insignificant trades and orders. With this app, a person can get real time trade and volume alerts from GDAX, Binance, and Bitfinex. These alerts currently occur on Telegram, but are easily switchable with other services.

**Note** : This README mostly deals with the setup and execution of the app. If you want to understand the working of the project and code, please refer to the [wiki][] section.

## A Note About Exchange APIs
You might notice I haven't used any of the exchanges' respective node modules in this project, and have instead gone with the raw REST APIs. This is because I did not realize these modules existed until much later into the development process. Therefore, I understand that my API calls might come with manual need for stream management. But I feel going through the documentations of these modules, then rewriting the code would cause a significant waste of time and resources until I am made to realize otherwise.

## Table of Contents
* [Basic Setup](#basic-setup)
* [Customizing](#customizing)
  + [Currency Pairs](#currency-pairs)
  + [Limits](#limits)
  + [Alerts](#alerts)
* [Screenshots](#screenshots)
* [Contributing](#contributing)
* [Contact](#contact)
* [Support](#support)
* [License](#license)

## Basic Setup
1. [Fork][] and [Clone][] the repository

2. [Create a Telegram Bot][] using BotFather, note down the authorization-token.

3. Create a group or channel, and add the bot to it. Then [get the group/channel's chat_id][].

4. Create a PostgreSQL database.<br>
   **USEFUL LINKS**:<br>
   [Installation](https://www.postgresql.org/download/)<br>
   [Creating Database](https://www.tutorialspoint.com/postgresql/postgresql_create_database.htm)

5. Create a file with name ".env" in the parent directory.

6. Add the auth-token, respective chat_id(s), and database url to the ".env" file as key-value pairs in the form shown below. These key-value pairs will be exported to the environment variables.
    ```
    BOT_TOKEN=Your:<your-bot-token>
    CHAT_ID=<main-chat-id>
    TEST_CHAT_ID=<test-chat-id>
    DATABASE_URL=postgres://<username>@localhost:5432/<db-name>
    ```   
   + On a *nix OS, steps 4 and 5 can be combined by typing the following lines in sequence in the terminal:
      ```bash
     touch .env
     echo "BOT_TOKEN=<your-bot-token>" >> .env
     echo "CHAT_ID=<main-chat-id>" >> .env
     echo "TEST_CHAT_ID=<test-chat-id>" >> .env
     echo "DATABASE_URL=$USER@localhost:5432/<db-name>" >> .env
     ```
    + There is another optional environment variable for directing alerts to a test chat for development and testing purposes. If you want to do so, add the following on a new line to the ".env" file: `TESTING=true`
7. Run `npm install`, and run the app via `npm run start`.

**Notes**:
* A lot of the major hosting services come preinstalled with PostgreSQL or provide some plugin. Therefore the steps for creating and setting up the database may differ. For example, [Heroku](https://www.heroku.com/) has an excellend PostgreSQL plugin which upon installation automatically adds the environment variable for the database URL.
* On your local machine, the app will be served on port 3000 of localhost.

## Customizing
The app is made to use certain limits and services that may or may not be suitable for others. Therefore it is possible to make changes and customize the app to better suit the developers requirements. Please do not send pull requests to the main repository with these changes.

### Currency Pairs
Currency pairs are defined in the [config.js][] file, and can easily be added and removed as needed. One needs to be mindful to try and add pairs that are supported by both Binance and Bitfinex. Not doing so can cause unexpected behavior. 

### Limits
The alerts are triggered by checking the various limits for the crypto-currency. You can learn about each limit in the [wiki][] section of this project.

Limit changes are persistent and are saved to the PostgreSQL databse on the running machine. Limits can easily be changed without affecting the repository through the browser by going to the endpoint of the running app. If you are running the app on your local machine, it'll be served on [localhost:3000](http://localhost:3000).

Limits can also be changed by editing the migration file, and running `npm run db:migrate`, in which case changes will be saved on the repository level. **This method is not recommended if you plan to contribute to the main repository.**

### Alerts
The app currently uses Telegram as the medium for alerts. However, if one requires they can choose to add and/or replace it with other services like Discord. It is recommended you keep the structure of the functions the same.

The alerts are managed in [message.js](./lib/message.js).

## Screenshots
### **Telegram :**
<img src="./screenshots/telegram.png" alt="drawing" width="300px"/>

### **Webpage :**
<img src="./screenshots/web.png" alt="drawing" width="800px"/>

## Contributing
If you are a developer trying to contribute to this project, please follow these steps:
1. Fork and Clone the repository.
2. Run `npm install`.
3. Export the DATABASE_URL to the environment using `export` or adding it to a ".env" file.
4. Run `npm start` or `npm run start:dev` to see if it runs without errors.
5. Tests can be performed by running `npm test`

Please refer [Contribution Guidelines][] for more information.

## Contact
**Telegram** : @uzair_inamdar

## Support
My future goals include:
* Host the server and create a channel/group for everyone to join.
* Make currency selection dynamic.
* Make native smartphone and desktop version of the app.

If you like the project and would like to keep seeing future improvements, please consider donating to support hosting and other expenses.

[![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://www.paypal.me/UzairIn)

**BTC** : `174EZsHia5YJqp9v4dNFgauLGB9x4uPbAN`

**ETH** : `0x05ce071925189beb5d8dff046ee5f1cbb1c5b7ef`

## License
[GPLv3](LICENSE)


[Fork]: https://help.github.com/articles/fork-a-repo/
[Clone]: https://help.github.com/articles/cloning-a-repository/
[Create a Telegram Bot]: https://core.telegram.org/bots#6-botfather
[Tutorial]: https://tutorials.botsfloor.com/creating-a-bot-using-the-telegram-bot-api-5d3caed3266d
[get the group/channel's chat_id]: https://stackoverflow.com/a/32572159
[wiki]: https://github.com/uzillion/crypto-whale-watcher/wiki
[config.js]: https://github.com/uzillion/crypto-whale-watcher/blob/master/config.js
[Contribution Guidelines]: https://github.com/uzillion/pg-accessor/blob/master/CONTRIBUTING.md
