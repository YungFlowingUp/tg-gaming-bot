const logger = require("../../utils/logger");
const { gameSelectionKeyboard } = require("../../keyboards/roomsManagerKeyboards");

async function handleShowId(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name;

    await bot.sendMessage(chatId, "✨<b>Ваш ID</b>✨", {
        parse_mode: 'HTML'
    });
    await bot.sendMessage(chatId, `${userId.toString()}`, gameSelectionKeyboard);  
    
    logger.info(`User ${username} asked for its ID - ${userId}. ChatID ${chatId}`);
}

module.exports = { handleShowId };