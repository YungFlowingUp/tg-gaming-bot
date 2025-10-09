const { isAdmin, isSuperAdmin } = require('./permissions');

function requireAdmin(originalHandler) {
    return async function wrappedHandler(bot, msg, globalStates) {
        const userId = msg.from.id;
        const chatId = msg.chat.id;
        
        const userIsAdmin = await isAdmin(userId);
        
        if (!userIsAdmin) {
            await bot.sendMessage(chatId, '❌ Это функция доступна только админам! 😤');
            return; 
        }
        
        return await originalHandler(bot, msg, globalStates);
    };
}

function requireSuperAdmin(originalHandler) {
    return async function wrappedHandler(bot, msg, globalStates) {
        const userId = msg.from.id;
        const chatId = msg.chat.id;
        
        const userIsSuperAdmin = await isSuperAdmin(userId);
        
        if (!userIsSuperAdmin) {
            await bot.sendMessage(chatId, '❌ Эта функция доступна только суперадминам! 🤬');
            return;
        }
        
        return await originalHandler(bot, msg, globalStates);
    };
}

module.exports = {
    requireAdmin,
    requireSuperAdmin
};