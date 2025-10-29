const logger = require("../../utils/logger");
const { requireAdmin } = require("../../utils/wrappers");

//TODO !!!!!!!!!
async function handleBegin(bot, msg, globalStates) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    await bot.sendMessage(chatId, 'Игра началась!');
    logger.error(`JUST TO CHECK!`);
}

module.exports = {
    handleBegin: requireAdmin(handleBegin)
};