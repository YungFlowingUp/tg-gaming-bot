const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const globalConfig = require('./configs/globalConfig');

const TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(TOKEN, {polling: true});
console.log("🥶🥶🥶 Bot has started! 🥶🥶🥶");

bot.setMyCommands(globalConfig.commands);

const globalStates = require('./states/globalStates');
const { registerAllHandlers } = require('./handlers');

registerAllHandlers(bot, globalStates);

bot.onText(/\/begin/, async (msg) => {
    const chatId = msg.chat.id;

});