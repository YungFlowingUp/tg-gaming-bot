const logger = require("../../utils/logger");
const { requireSuperAdmin, requireSuperAdminCallback } = require("../../utils/wrappers");
const { 
    addAdmin, getAllAdmins, 
    removeAdmin, demoteSuperAdmin 
} = require("../../utils/permissions");
const { 
    adminMainKeyboard, adminCancelKeyboard, 
    createAdminsListKeyboard, createSuperAdminConfirmKeyboard 
} = require("../../keyboards/adminKeyboards");

async function handleAdminPanel(bot, msg, globalStates) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    globalStates.clearAdminState(userId);
   
    await bot.sendMessage(chatId, '⚙️ Панель управления админами:', adminMainKeyboard);
    
    logger.info(`Admin panel is shown to user ${userId}. ChatID ${chatId}`); //? Logging admin panel is shown   
}

async function handleShowAdmins(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const admins = await getAllAdmins();  
    
    let message = '👥 <b>Список администраторов:</b>\n\n';

    message += '<b>👑 Суперадмины:</b>\n';
    admins.superAdmins.forEach((id, index) => {
        message += `  ${index + 1}. <code>${id}</code>\n`;
    });
    
    message += '\n<b>👥 Админы:</b>\n';
    admins.admins.forEach((id, index) => {
        message += `  ${index + 1}. <code>${id}</code>\n`;
    });

    message += `\n📊  Всего: <b>${admins.superAdmins.length}</b>  СУПЕР-админов, <i>${admins.admins.length}</i>  админов`;
    
    await bot.sendMessage(chatId, message, {
        ...adminMainKeyboard,
        parse_mode: 'HTML'
    });

    //? Logging the list of admins was shown
    logger.info(`List of all admins was is to user ${userId} with ` +
        `${admins.superAdmins.length} super admins, ${admins.admins.length} admins` +
        `. ChatID ${chatId}`
    ); 
}

async function handleAddAdmin(bot, msg, globalStates) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    globalStates.setAdminState(userId, globalStates.ADMIN_STATES.AWAITING_ADMIN_ID);

    await bot.sendMessage(chatId, 
        '👥 <b>Добавление обычного админа</b>\n' +
        'Введите ID пользователя:\n' +
        'Пример: <code>322369148</code>', { 
        ...adminCancelKeyboard,
        parse_mode: 'HTML'
    });

    logger.info(`ID Input mode for adding a regular admin is active for user ${userId}. ChatID ${chatId}`); //? Logging input for regular admins is active
}

async function handleAddSuperAdmin(bot, msg, globalStates) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    globalStates.setAdminState(userId, globalStates.ADMIN_STATES.AWAITING_SUPERADMIN_ID);

    await bot.sendMessage(chatId, 
        '👥 <b>Добавление СУПЕР-админа</b>\n' +
        'Введите ID пользователя:\n' +
        'Пример: <code>322369148</code>', { 
        ...adminCancelKeyboard,
        parse_mode: 'HTML'
    });

    logger.info(`ID Input mode for adding a SUPER-admin is active for user ${userId}. ChatID ${chatId}`); //? Logging input for SUPER-admins is active
}

async function handleRemoveAdmin(bot, msg, globalStates) {
    try {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        
        const admins = await getAllAdmins();       
        
        const adminsListKeyboard = createAdminsListKeyboard(admins);
        
        await bot.sendMessage(chatId, 
            '🗑️ <b>Выберите администратора для удаления или понижения прав:</b>\n\n' +
            '👑 - СУПЕР-админ\n' +
            '👥 - Обычный админ\n\n' +
            '<i>Нажмите на нужного администратора</i>', {
            parse_mode: 'HTML',
            ...adminsListKeyboard
        });
        logger.info(`The keyboard with all the admins is shown for user ${userId}. Removing mode. ChatID ${chatId}`); //? Logging keyboard with all the admins was shown
    } catch (error) {
        logger.error(`handleRemoveAdmin failed with error ${error}`); //? Logging the error 
    }
}

async function handleAdminCallbackQuery(bot, callbackQuery, globalStates) {
    try {
        const chatId = callbackQuery.message.chat.id;
        const userId = callbackQuery.from.id;
        const data = callbackQuery.data;

        await bot.answerCallbackQuery(callbackQuery.id); //* No loading
        
        //* Handling canceling
        if (data === 'admin_cancel') {
            await bot.editMessageText('❌ Действие отменено.', {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                reply_markup: { inline_keyboard: [] }
            });
            logger.warn(`The user ${userId} exits the removing admin mode. ChatID ${chatId}`); //? Logging user exits removing mode
            
            //* Showing admin panel again
            await bot.sendMessage(chatId, '⚙️ <b>Панель управления админами</b>', {
                ...adminMainKeyboard,
                parse_mode: 'HTML'
            });
            logger.debug(`Admin panel is shown again to user ${userId}. ChatID ${chatId}`); //? Logging the admin panel keyboard was shown again
            return;
        }
        
        //* Handling choosing of an admin (+ sending confiramtion if super admin is chosen)
        if (data.startsWith('remove_admin:')) {
            const parts = data.split(':');
            const selectedUserId = parseInt(parts[1]); //* Converting to a number
            const adminType = parts[2]; //* 'super' или 'admin'            
            
            //* Checking if deleteing myself
            if (selectedUserId === userId) {
                await bot.editMessageText('❌ Нельзя удалить самого себя.', {
                    chat_id: chatId,
                    message_id: callbackQuery.message.message_id,
                    reply_markup: { inline_keyboard: [] }
                });
                logger.warn(`Declined! The user ${userId} tried to remove themself (selected id - ${selectedUserId}). ChatID ${chatId}`); //? Logging user selected themself
                return;
            }
            
            //* If deleting a regular admin - delete straight up!
            if (adminType === 'admin') {
                logger.info(`Selected regular admin ${selectedUserId} by user ${userId}. ChatID ${chatId}`); //? Logging the regular admin was selected for removing

                const result = await removeAdmin(selectedUserId, false);                
                
                //? Logging regular admin was removed
                logger.info(`Regular admin ${selectedUserId} is removed by user ${userId}. ChatID ${chatId}. ` +
                    `Result: success - ${result.success}, type - ${result.type}, message - ${result.message}`
                ); 
                await bot.editMessageText(result.message, {
                    chat_id: chatId,
                    message_id: callbackQuery.message.message_id,
                    parse_mode: 'HTML',
                    reply_markup: { inline_keyboard: [] }
                });
                logger.debug(`Admin panel is shown again to user ${userId}. ChatID ${chatId}`); //? Logging the admin panel keyboard was shown again
            } //* If deleting a super admin - needed confirmation!            
            else if (adminType === 'super') { 
                const confirmationKeyboard = createSuperAdminConfirmKeyboard(selectedUserId);
                
                logger.info(`Selected SUPER-admin ${selectedUserId} by user ${userId}. ChatID ${chatId}`); //? Logging the SUPER-admin was selected for removing

                await bot.editMessageText(
                    `⚠️ <b>ВНИМАНИЕ!</b>\n\n` +
                    `Вы пытаетесь удалить СУПЕР-админа <code>${selectedUserId}</code>\n\n` +
                    `👑👥 Этот пользователь имеет права СУПЕР-админа и обычного админа\n\n` +
                    `Выберите действие:`, {
                    chat_id: chatId,
                    message_id: callbackQuery.message.message_id,
                    parse_mode: 'HTML',
                    ...confirmationKeyboard
                });
                logger.debug(`Confirmation inline keyboard is shown to user ${userId}. ChatID ${chatId}`); //? Logging the confirmation inline keyboard was shown
            }
        }
        
        //* Handling super admin removing confirmation 
        if (data.startsWith('confirm_remove:')) {
            const parts = data.split(':');
            const userIdToRemove = parseInt(parts[1]);
            const action = parts[2]; //* 'full' || 'demote'
            
            let result;
            
            if (action === 'full') {                
                result = await removeAdmin(userIdToRemove, true);

                //? Logging admin was completly removed from all the admins
                logger.info(`Admin ${userIdToRemove} is completly removed from all the admins by user ${userId}. ChatID ${chatId}. ` +
                    `Result: success - ${result.success}, type - ${result.type}, message - ${result.message}`
                ); 
            } else if (action === 'demote') {
                result = await demoteSuperAdmin(userIdToRemove);

                //? Logging admin was demoted to a regular admin
                logger.info(`Admin ${userIdToRemove} is demoted to a regular admin by user ${userId}. ChatID ${chatId}` +
                    `Result: success - ${result.success}, type - ${result.type}, message - ${result.message}`
                ); 
            }
            
            await bot.editMessageText(result.message, {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: [] }
            });
            logger.debug(`Inline keyboard is hidden to user ${userId}. ChatID ${chatId}`); //? Logging the inline keyboard was hidden
        }
        
    } catch (error) {
        logger.error(`Couldn't remove/demote an admin with error ${error}`); //? Logging the error
    }
}

async function _handleAdminIdInput(bot, msg, globalStates) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    const userState = globalStates.getAdminState(userId);

    //* Just checking for the record
    if (!userState) return;

    //* Handling canceling 
    if (text === '❌ Отмена') {
        globalStates.clearAdminState(userId);
        await handleAdminPanel(bot, msg, globalStates);
        logger.warn(`The user ${userId} left the ID input mode. ChatID ${chatId}`); //? Logging ID input mode was left
        return;
    }

    //* Input validation
    const inputId = parseInt(text.trim());
    if (isNaN(inputId) || inputId <= 0) {
        logger.warn(`The user ${userId} has typed the wrong id (${text.trim()}). ChatID ${chatId}`); //? Logging the wrong id was typed

        await bot.sendMessage(chatId, 
            '👥 <b>Добавление ' +
            `${userState.state === globalStates.ADMIN_STATES.AWAITING_ADMIN_ID ? 'админа' : 'СУПЕР-админа'}</b>\n` +
            '❌ Пожалуйста, введите корректный числовой ID.\nПример: <code>322369148</code>', {
            ...adminCancelKeyboard,
            parse_mode: 'HTML'
        });

        //? Logging warning was shown
        logger.debug(`The warning is shown to the user ${userId}. The ID input mode is still active. ChatID ${chatId}`); 
        return;
    }
    
    //* Adding an admin
    let result;
    if (userState.state === globalStates.ADMIN_STATES.AWAITING_ADMIN_ID) { //* Regular admin
        result = await addAdmin(inputId, false); 

        //? Logging regular admin was added
        logger.info(`Regular admin ${inputId} is added by user ${userId}. ChatID ${chatId}. ` +
            `Result: success - ${result.success}, type - ${result.type}, message - ${result.message}`
        ); 
    } 
    else if (userState.state === globalStates.ADMIN_STATES.AWAITING_SUPERADMIN_ID) { //* Super admin
        result = await addAdmin(inputId, true); 

        //? Logging SUPER-admin was added
        logger.info(`SUPER-admin ${inputId} is added by user ${userId}. ChatID ${chatId}. ` +
            `Result: success - ${result.success}, type - ${result.type}, message - ${result.message}`
        ); 
    }
    
    //* Clearing state
    globalStates.clearAdminState(userId);
    

    await bot.sendMessage(chatId, result.message, {
        ...adminMainKeyboard,
        parse_mode: 'HTML'
    });
    logger.debug(`Admin panel keyboard is shown again for user ${userId}. ChatID ${chatId}`);

    handleShowAdmins(bot, msg);
}

//* Handler for admin panel input text
async function handleAdminTextMessage(bot, msg, globalStates) {
    const userId = msg.from.id;
    const userState = globalStates.getAdminState(userId);
    
    if (userState) {
        if (userState.state === globalStates.ADMIN_STATES.AWAITING_ADMIN_ID || 
            userState.state === globalStates.ADMIN_STATES.AWAITING_SUPERADMIN_ID) {
            await _handleAdminIdInput(bot, msg, globalStates);
        }
    }
}


module.exports = {
    handleAdminPanel: requireSuperAdmin(handleAdminPanel), // Main admin panel

    handleAddAdmin: requireSuperAdmin(handleAddAdmin), // Adding an admin
    handleAddSuperAdmin: requireSuperAdmin(handleAddSuperAdmin), // Adding a super admin
    handleAdminTextMessage: requireSuperAdmin(handleAdminTextMessage), // Input from user. Then adding to admins

    handleRemoveAdmin: requireSuperAdmin(handleRemoveAdmin), // Removing an admin
    handleAdminCallbackQuery: requireSuperAdminCallback(handleAdminCallbackQuery), // Callback from inline keyboard

    handleShowAdmins: requireSuperAdmin(handleShowAdmins) // Showing the list of admins
}