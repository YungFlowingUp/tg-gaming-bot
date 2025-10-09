async function handleShowId(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    await bot.sendMessage(chatId, "✨<b>Ваш ID</b>✨", {
        parse_mode: 'HTML'
    });
    await bot.sendMessage(chatId, `${userId.toString()}`);    
}

module.exports = { handleShowId };