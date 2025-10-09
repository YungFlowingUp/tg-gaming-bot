const { handleStart } = require('./commandHandlers/startCommandHandler');

function registerAllHandlers(bot, globalStates) {
    bot.onText(/\/start/, (msg) => handleStart(bot, msg, globalStates));
    
}

module.exports = { registerAllHandlers };