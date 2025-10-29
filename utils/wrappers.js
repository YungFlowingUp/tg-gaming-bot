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
            await bot.sendMessage(chatId, '❌ Эта функция доступна только СУПЕР-админам! 🤬');
            return;
        }
        
        return await originalHandler(bot, msg, globalStates);
    };
}

function requireSuperAdminCallback(originalHandler) {
    return async function wrappedHandler (bot, callbackQuery, globalStates) {
        const userId = callbackQuery.from.id;
        const chatId = callbackQuery.message.chat.id;

        const userIsSuperAdmin = await isSuperAdmin(userId); 

        if (!userIsSuperAdmin) {
            await bot.answerCallbackQuery(callbackQuery.id, {
                reply_markup: { inline_keyboard: [] },
                text: '❌ Доступ только для СУПЕР-админов!',
                show_alert: true
            });
            await bot.editMessageText('❌ Действие запрещено!.', {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                reply_markup: { inline_keyboard: [] }
            });
            return;
        }
        
        return originalHandler(bot, callbackQuery, globalStates);
    };
}

module.exports = {
    requireAdmin,
    requireSuperAdmin,
    requireSuperAdminCallback
};