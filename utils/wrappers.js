const logger = require('./logger');
const { isAdmin, isSuperAdmin } = require('./permissions');

function requireAdmin(originalHandler) {
    return async function wrappedHandler(bot, msg, globalStates) {
        const userId = msg.from.id;
        const chatId = msg.chat.id;        
        
        //? Logging calling the admin rights check
        logger.debug(`Admin access check. Data: ` +
            `userId: ${userId}, chatId: ${chatId}, handler: ${originalHandler.name}`
        );

        const userIsAdmin = await isAdmin(userId);
        
        if (!userIsAdmin) {
            //? Logging declined - no admin rights
            logger.warn(`Unauthorized admin access attempt. Data: ` +
                `userId: ${userId}, chatId: ${chatId}, handler: ${originalHandler.name}, `+
                `message: ${msg.text || 'no_text_in_message'}`
            );

            await bot.sendMessage(chatId, '❌ Это функция доступна только админам! 😤');
            return; 
        }
        //? Logging the user has admin rights
        logger.debug(`Admin access granted. Data: ` +
            `userId: ${userId}, chatId: ${chatId}, handler: ${originalHandler.name}` 
        );

        return await originalHandler(bot, msg, globalStates);
    };
}

function requireSuperAdmin(originalHandler) {
    return async function wrappedHandler(bot, msg, globalStates) {
        const userId = msg.from.id;
        const chatId = msg.chat.id;

        //? Logging calling the SUPER-admin rights check
        logger.debug(`SUPER-admin access check. Data: ` +
            `userId: ${userId}, chatId: ${chatId}, handler: ${originalHandler.name}`
        );

        const userIsSuperAdmin = await isSuperAdmin(userId);      
        
        if (!userIsSuperAdmin) {
            //? Logging declined - no SUPER-admin rights
            logger.warn(`Unauthorized SUPER-admin access attempt. Data: ` +
                `userId: ${userId}, chatId: ${chatId}, handler: ${originalHandler.name}, ` +
                `message: ${msg.text || 'no_text_in_message'}`
            );

            await bot.sendMessage(chatId, '❌ Эта функция доступна только СУПЕР-админам! 🤬');
            return;
        }
        
        //? Logging the user has SUPER-admin rights
        logger.debug(`SUPER-admin access granted. Data: ` +
            `userId: ${userId}, chatId: ${chatId}, handler: ${originalHandler.name}` 
        );

        return await originalHandler(bot, msg, globalStates);
    };
}

function requireSuperAdminCallback(originalHandler) {
    return async function wrappedHandler (bot, callbackQuery, globalStates) {
        const userId = callbackQuery.from.id;
        const chatId = callbackQuery.message.chat.id;

        //? Logging calling the SUPER-admin rights check
        logger.debug(`SUPER-admin callback access check. Data: ` +
            `userId: ${userId}, chatId: ${chatId}, handler: ${originalHandler.name}`
        );

        const userIsSuperAdmin = await isSuperAdmin(userId); 

        if (!userIsSuperAdmin) {
            //? Logging declined - no SUPER-admin rights
            logger.warn(`Unauthorized SuperAdmin callback access attempt. Data: ` +
                `userId: ${userId}, chatId: ${chatId}, handler: ${originalHandler.name}` 
            );

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
        //? Logging the user has SUPER-admin rights for callback
        logger.debug(`SUPER-admin access for callback granted. Data: ` +
            `userId: ${userId}, chatId: ${chatId}, handler: ${originalHandler.name}` 
        );

        return originalHandler(bot, callbackQuery, globalStates);
    };
}

module.exports = {
    requireAdmin,
    requireSuperAdmin,
    requireSuperAdminCallback
};