const { handleStart } = require('./commandHandlers/startCommandHandler');
const { handleShowId } = require('./commandHandlers/showIdCommandHandler');
const { handleBegin } = require('./commandHandlers/beginCommandHandler');

function registerAllHandlers(bot, globalStates) {
    bot.onText(/\/start/, (msg) => handleStart(bot, msg, globalStates));
    bot.onText(/\/showid/, (msg) => handleShowId(bot, msg));
    bot.onText(/\/begin/, (msg) => handleBegin(bot, msg, globalStates));  //! ADMINS only!
}

module.exports = { registerAllHandlers };