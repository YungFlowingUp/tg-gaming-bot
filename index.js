const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const globalConfig = require('./configs/globalConfig');
const logger = require('./utils/logger');

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

const commands = require('./configs/commands');
bot.setMyCommands(commands);
logger.info(`The mode is ${globalConfig.rooms.enabled ? '✅ ROOMS ENABLED' : '❌  NO ROOMS'}`); //? Logging starting

const { GlobalStates } = require('./states/globalStates');
const globalStates = new GlobalStates();

const RoomManager = require('./rooms/RoomManager');
const roomManager = new RoomManager();
roomManager.createDefault();

const RoomDashboard = require('./rooms/RoomDashboard');
const roomDashboard = new RoomDashboard(bot, roomManager);

const { registerAllHandlers } = require('./handlers');
registerAllHandlers(bot, globalStates, roomManager, roomDashboard);