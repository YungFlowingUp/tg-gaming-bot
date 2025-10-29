const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const logger = require('./utils/logger');

const globalConfig = require('./configs/globalConfig');

const TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { 
    polling: {
        interval: 300,
        autoStart: true,
        params: {
            timeout: 10,
            limit: 100
        }
    }
});

logger.info('🥶🥶🥶  Bot has started! 🥶🥶🥶'); //? Logging starting

bot.setMyCommands(globalConfig.commands);

const globalStates = require('./states/globalStates');
const { registerAllHandlers } = require('./handlers');

registerAllHandlers(bot, globalStates);

bot.onText(/\/begining/, async (msg) => {
    const chatId = msg.chat.id;

});