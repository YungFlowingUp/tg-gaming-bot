const { requireAdmin } = require("../../utils/wrappers");

async function handleBegin(bot, msg, globalStates) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    await bot.sendMessage(chatId, 'Игра началась!');
}

module.exports = {
    handleBegin: requireAdmin(handleBegin)
};