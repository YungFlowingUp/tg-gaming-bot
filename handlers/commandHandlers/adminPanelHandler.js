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
    
    //TODO delete
    console.log("LOGGING: handleAdminPanel")
    console.log(globalStates);
    console.log("-".repeat(60));
    
}

async function handleShowAdmins(bot, msg) {
    const chatId = msg.chat.id;

    const admins = await getAllAdmins();  
    
    //TODO delete
    console.log(admins);
    console.log("-".repeat(60));

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

    //TODO delete
    console.log(globalStates);
    console.log("-".repeat(60));
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

    //TODO delete
    console.log(globalStates);
    console.log("-".repeat(60));
}

async function handleRemoveAdmin(bot, msg, globalStates) {
    try {
        const chatId = msg.chat.id;
        
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
        
    } catch (error) {
        console.log('❌ Ошибка в handleRemoveAdmin:', error.message);
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
            
            //* Showing admin panel
            await bot.sendMessage(chatId, '⚙️ <b>Панель управления админами</b>', {
                ...adminMainKeyboard,
                parse_mode: 'HTML'
            });
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
                return;
            }
            
            //* If deleting a regular admin - delete straight up!
            if (adminType === 'admin') {
                const result = await removeAdmin(selectedUserId, false);
                
                await bot.editMessageText(result.message, {
                    chat_id: chatId,
                    message_id: callbackQuery.message.message_id,
                    parse_mode: 'HTML',
                    reply_markup: { inline_keyboard: [] }
                });
            } //* If deleting a super admin - needed confirmation!            
            else if (adminType === 'super') { 
                const confirmationKeyboard = createSuperAdminConfirmKeyboard(selectedUserId);
                
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
            } else if (action === 'demote') {
                result = await demoteSuperAdmin(userIdToRemove);
            }
            
            await bot.editMessageText(result.message, {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: [] }
            });
        }
        
    } catch (error) {
        console.log('❌ Ошибка в handleAdminCallbackQuery:', error.message);
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
        return;
    }

    //* Input validation
    const inputId = parseInt(text.trim());
    if (isNaN(inputId) || inputId <= 0) {
        await bot.sendMessage(chatId, 
            '👥 <b>Добавление ' +
            `${userState.state === globalStates.ADMIN_STATES.AWAITING_ADMIN_ID ? 'админа' : 'СУПЕР-админа'}</b>\n` +
            '❌ Пожалуйста, введите корректный числовой ID.\nПример: <code>322369148</code>', {
            ...adminCancelKeyboard,
            parse_mode: 'HTML'
        });

        return;
    }
    
    //* Adding an admin
    let result;
    if (userState.state === globalStates.ADMIN_STATES.AWAITING_ADMIN_ID) { //* Regular admin
        result = await addAdmin(inputId, false); 
    } 
    else if (userState.state === globalStates.ADMIN_STATES.AWAITING_SUPERADMIN_ID) { //* Super admin
        result = await addAdmin(inputId, true); 
    }
    
    //* Clearing state
    globalStates.clearAdminState(userId);
    
    //TODO delete
    console.log(globalStates);
    console.log("-".repeat(60));

    await bot.sendMessage(chatId, result.message, {
        ...adminMainKeyboard,
        parse_mode: 'HTML'
    });

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