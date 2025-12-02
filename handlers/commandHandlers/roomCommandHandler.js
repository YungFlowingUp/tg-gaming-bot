const { mainRoomsKeyboard } = require("../../keyboards/roomsManagerKeyboards");
const { 
    gameSelectionKeyboard, roomCreatorKeyboard, createChangeSettingsKeyboard,
    createPlayersInRoomKeyboard, roomConfirmationKeyboard,
    createUsersKeyboard
} = require("../../keyboards/roomKeyboards");
const logger = require("../../utils/logger");
const { isAdmin } = require("../../utils/permissions");

async function handleChooseGame(bot, msg, globalStates, roomManager) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    
    try {
        const roomId = globalStates.getUserRoomState(userId);
        const room = roomManager.getRoom(roomId);
        const currentGame = room.game ? room.game : "Не выбрана";

        await bot.sendMessage(
            chatId, 
            `Текущая игра - ${currentGame}\nВыберите игру: `, 
            gameSelectionKeyboard
        );
    } catch(error) {
        const roomId = globalStates.getUserRoomState(userId);
        const room = roomManager.getRoom(roomId);
        logger.error(`Couldn't open game choosing menu for user ${userId} in room ${room?.id ? room.id : 'no such room exists'}. Error: ` + error);
    }
}

async function handleStartGame(bot, msg, globalStates, roomManager) { //TODO
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    const roomId = globalStates.getUserRoomState(userId);
    const room = roomManager.getRoom(roomId);
    room.status = 'playing';

    await bot.sendMessage(chatId, 'Игра началась!');
}

async function handleRoomSettings(bot, msg, globalStates, roomManager) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    const roomId = globalStates.getUserRoomState(userId);
    const room = roomManager.getRoom(roomId);

    const changingSettingskeyboard = createChangeSettingsKeyboard(room);
    await bot.sendMessage(chatId, '⚙️ Настройки комнаты', changingSettingskeyboard);
    logger.debug(`Settings menu was shown to creator ${userId} in room ${room.id}`);
}

async function handleKickPlayer(bot, msg, globalStates, roomManager) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    const roomId = globalStates.getUserRoomState(userId);
    const room = roomManager.getRoom(roomId);
    const playersInRoom = room.players;

    const listOfAllPlayersInRoomKeyboard = createPlayersInRoomKeyboard(playersInRoom);
    await bot.sendMessage(
        chatId,
        'Выберите игрока которого ходите выгнать из комнаты',
        listOfAllPlayersInRoomKeyboard
    );
    logger.debug(`List of all players in room ${room.id} was shown to user ${userId}`);
}

async function handleDeleteRoom(bot, msg, globalStates, roomManager) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    await bot.sendMessage(
        chatId,
        '❓ Действительно хотите удалить комнату?',
        roomConfirmationKeyboard
    );
    logger.debug(`Confirmation room deleting keyboard was shown to creator ${userId}`);
}

async function handleLeaveRoom(bot, msg, globalStates, roomManager, roomDashboard) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    try {
        const roomId = globalStates.getUserRoomState(userId);
        const room = roomManager.getRoom(roomId);

        room.removePlayer(userId);     
        globalStates.clearUserRoomState(userId);

        await bot.sendMessage(chatId, '✅ Вы успешно покинули комнату!', mainRoomsKeyboard);   

        if (room.players.size === 0) { //* If a room became empty
            roomManager.deleteRoom(roomId);
        } else { //* If room still contains players
            await bot.sendMessage(
                parseInt(room.createdBy),
                `👑 Вы стали создателем комнаты ${room.name}`,
                roomCreatorKeyboard
            );

            await roomDashboard.removeDashboardForUser(userId, room.id);
            await roomDashboard.updateDashboardForAll(room.id);
        }     
    } catch (error) {
        const roomId = globalStates.getUserRoomState(userId);
        const room = roomManager.getRoom(roomId);
        logger.error(`The user ${userId} couldn't leave room ${room?.id ? room.id : 'no such room exists'}. Error: ` + error);
    }
}

async function handleSetReady(bot, msg, globalStates, roomManager, roomDashboard) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const isReadyCommand = msg.text === '🟢 Готов';
    
    try {
        const roomId = globalStates.getUserRoomState(userId);
        const room = roomManager.getRoom(roomId);
        const user = room.getPlayer(userId);
        if (user.isReady === isReadyCommand) { //* If the status the same            
            const keyboard = createUsersKeyboard(user.isReady, await isAdmin(userId));
            await bot.sendMessage(
                chatId,
                `Вы и так уже ${isReadyCommand ? 'готовы' : 'НЕ готовы'}!`,
                keyboard
            );
        } else { //* If user changes his status
            user.isReady = isReadyCommand;
            const keyboard = createUsersKeyboard(user.isReady, await isAdmin(userId));
            await bot.sendMessage(
                chatId,
                `Вы и сменили готовность теперь вы: ${msg.text}!`,
                keyboard
            );
            logger.debug(`The user ${userId} in room ${room.id} changed readiness from ${!user.isReady} to ${user.isReady}`);

            await roomDashboard.updateDashboardForAll(room.id);
        }
    } catch (error) {
        const roomId = globalStates.getUserRoomState(userId);
        const room = roomManager.getRoom(roomId);
        logger.error(`The user ${userId} couldn't change isReady flag in room ${room?.id ? room.id : 'no such room exists'}. Error: ` + error);
        await bot.sendMessage(chatId, '❌ Произошла ошибка при изменении статуса');
    }
}

async function handleRefreshDashboard(bot, msg, globalStates, roomManager, roomDashboard) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    try {
        const roomId = globalStates.getUserRoomState(userId);
        await roomDashboard.removeDashboardForUser(userId, roomId);

        await roomDashboard.createOrUpdateDashboard(userId, roomId);

        logger.info(`Dashboard message was refreshed manually by user ${userId} in room ${roomId}`);
    } catch (error) {
        const roomId = globalStates.getUserRoomState(userId);
        const room = roomManager.getRoom(roomId);
        logger.error(`The user ${userId} couldn't refresh dashboard in room ${room?.id ? room.id : 'no such room exists'}. Error: ` + error);
        await bot.sendMessage(chatId, '❌ Произошла ошибка при ручном вызове дашборда');
    }
}

async function handleChoosingGameCallbackQuery(bot, callbackQuery, globalStates, roomManager, roomDashboard) {   
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    
    await bot.answerCallbackQuery(callbackQuery.id); //* Remove loading

    try {
        const roomId = globalStates.getUserRoomState(userId);
        const room = roomManager.getRoom(roomId);
        
        const previousGame = room.game ? room.game : "Не выбрана";

        let chosenGame = data.split(":")[1];
        if (chosenGame === "null") {
            chosenGame = null;
        }

        if (chosenGame === 'cancel') { //* Cancel
            await bot.deleteMessage(chatId, callbackQuery.message.message_id);
            logger.debug(`The user ${userId} canceled changing game for room ${room.id}`);
            return 
        }
        if (chosenGame === previousGame) { //* If a previous game equals to a new one
            await bot.deleteMessage(chatId, callbackQuery.message.message_id);
            return
        } else { //* Normal changing
            room.game = chosenGame;
            logger.info(`The user ${userId} changed the game from ${previousGame} to ${chosenGame} in room ${room.id}`);

            await bot.editMessageText(`Игра изменена с ${previousGame} на ${chosenGame || 'Не выбрана'}`, {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                roomCreatorKeyboard
            });
        }
        
        await roomDashboard.updateDashboardForAll(room.id);
    } catch(error) {
        const roomId = globalStates.getUserRoomState(userId);
        const room = roomManager.getRoom(roomId);
        logger.error(`Couldn't change game by user ${userId} in room ${room.id ? room.id : 'no such room exists'}. Error: ` + error);
    }
}

async function handleChangingSettingsCallbackQuery(bot, callbackQuery, globalStates, roomManager, roomDashboard) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    chosenSetting = data.split(":")[1];

    await bot.answerCallbackQuery(callbackQuery.id); //* Remove loading

    try {
        const roomId = globalStates.getUserRoomState(userId);
        const room = roomManager.getRoom(roomId);

        if (chosenSetting === "cancel") { //* Cancel
            await bot.deleteMessage(chatId, callbackQuery.message.message_id);
            globalStates.clearRoomSettingsState(userId);
            logger.debug(`The user ${userId} canceled changing settings for room ${room.id}`);
            return;
        }
        if (chosenSetting === "back") { //* Back
            await bot.deleteMessage(chatId, callbackQuery.message.message_id);
            globalStates.clearRoomSettingsState(userId);

            const changingSettingskeyboard = createChangeSettingsKeyboard(room);
            await bot.sendMessage(chatId, '⚙️ Настройки комнаты', changingSettingskeyboard);
            logger.debug(`The user ${userId} got back from input mode to room settings menu. Room id is ${room.id}`);
            return;
        }

        switch (chosenSetting) {
            case 'name':
                globalStates.setRoomSettingsState(userId, globalStates.ROOM_SETTINGS_STATES.AWAITING_ROOM_NAME);
                logger.debug(`The creator ${userId} of room ${roomId} is in name input mode`);
                await bot.editMessageText(
                    '✏️ Введите новое название комнаты (1-15 символов):',
                    {
                        chat_id: chatId,
                        message_id: callbackQuery.message.message_id,
                        reply_markup: { inline_keyboard: [[
                            { text: '🔙 Назад', callback_data: 'change_room_settings:back' }
                        ]]}
                    }
                );
                break;
            
            case 'max_players': 
                globalStates.setRoomSettingsState(userId, globalStates.ROOM_SETTINGS_STATES.AWAITING_MAX_PLAYERS);
                logger.debug(`The creator ${userId} of room ${roomId} is in maximum players input mode`);
                await bot.editMessageText(
                    `👥 Введите максимальное количество игроков (3-20):\nТекущее количество игроков: ${room.getPlayersCount()}`,
                    {
                        chat_id: chatId,
                        message_id: callbackQuery.message.message_id,
                        reply_markup: { inline_keyboard: [[
                            { text: '🔙 Назад', callback_data: 'change_room_settings:back' }
                        ]]}
                    }
                );
                break;
            
            case 'set_password': 
                globalStates.setRoomSettingsState(userId, globalStates.ROOM_SETTINGS_STATES.AWAITING_PASSWORD, roomId);
                logger.debug(`The creator ${userId} of room ${roomId} is in password input mode`);
                await bot.editMessageText(
                    '🔒 Введите пароль для комнаты (1-10 символов):',
                    {
                        chat_id: chatId,
                        message_id: callbackQuery.message.message_id,
                        reply_markup: { inline_keyboard: [[
                            { text: '🔙 Назад', callback_data: 'change_room_settings:back' }
                        ]]}
                    }
                );
                break;
            
            case 'remove_password':
                room.settings.isPrivate = false;
                room.settings.password = null;
                
                const updatedKeyboard = createChangeSettingsKeyboard(room);
                await bot.editMessageText(
                    '✅ Пароль удален!',
                    {
                        chat_id: chatId,
                        message_id: callbackQuery.message.message_id,
                        ...updatedKeyboard
                    }
                );
                logger.info(`The room ${room.id} has changed from private to public. No password needed`);
                await roomDashboard.updateDashboardForAll(room.id);
                break;
        }
    } catch (error) {
        const roomId = globalStates.getUserRoomState(userId);
        const room = roomManager.getRoom(roomId);
        logger.error(`Couldn't proccess callback from changing room settings (${chosenSetting}) ` +
            `by user ${userId} in room ${room?.id ? room.id : 'no such room exists'}. Error: ` + error
        );
    }
}

async function handleKickPlayerCallbackQuery(bot, callbackQuery, globalStates, roomManager, roomDashboard) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    const playerForKicking = data.split(":")[1];

    await bot.answerCallbackQuery(callbackQuery.id); //* Remove loading

    if (playerForKicking === "cancel") {
        await bot.deleteMessage(chatId, callbackQuery.message.message_id);
        return;
    }
    try {
        const roomId = globalStates.getUserRoomState(userId);
        const room = roomManager.getRoom(roomId);
        const playersInRoom = room.players;

        if (playerForKicking == userId) {
            const listOfAllPlayersInRoomKeyboard = createPlayersInRoomKeyboard(playersInRoom);
            await bot.editMessageText(
                '❌ Нельзя выгнать себя из комнаты - вы можете только ее покинуть!', 
                {
                    chat_id: chatId,
                    message_id: callbackQuery.message.message_id,
                    ...listOfAllPlayersInRoomKeyboard
                }
            );
            return;
        } 
        if (playerForKicking == room.createdBy) { //* Kicking a creator by admin
            const listOfAllPlayersInRoomKeyboard = createPlayersInRoomKeyboard(playersInRoom);
            await bot.sendMessage(
                '❌ Нельзя выгнать создателя комнаты', 
                {
                   chat_id: chatId,
                    message_id: callbackQuery.message.message_id, 
                    ...listOfAllPlayersInRoomKeyboard
                }
            );
            return;
        }
        
        room.removePlayer(parseInt(playerForKicking));
        globalStates.clearUserRoomState(parseInt(playerForKicking));
        await bot.editMessageText(
            '✅ Игрок исключён!',
            {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,                        
            }
        );

        await bot.sendMessage(
            playerForKicking, 
            `Вы были исключены из комнаты ${room.name}`, 
            mainRoomsKeyboard
        );

        await roomDashboard.removeDashboardForUser(userId, roomId);
        await roomDashboard.updateDashboardForAll(room.id);
    } catch (error) {
        const roomId = globalStates.getUserRoomState(userId);
        const room = roomManager.getRoom(roomId);
        logger.error(`Couldn't proccess callback from kicking a player with id ${playerForKicking} ` +
            `by user ${userId} in room ${room?.id ? room.id : 'no such room exists'}. Error: ` + error
        )
    }
}

async function handleDeleteRoomCallbackQuery(bot, callbackQuery, globalStates, roomManager, roomDashboard) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    const confirmation = data.split(":")[1];   

    const roomId = globalStates.getUserRoomState(userId);

    await bot.answerCallbackQuery(callbackQuery.id); //* Remove loading

    if (confirmation === "cancel") {
        await bot.deleteMessage(chatId, callbackQuery.message.message_id);
        return;
    }

    try {
        const room = roomManager.getRoom(roomId);
        const roomName = room.name;

        const players = room.players;
        
        for (const [playerId, playerData] of players) {
            globalStates.clearUserRoomState(playerId);
            await roomDashboard.removeDashboardForUser(playerId, room.id);                         
        }
        roomManager.deleteRoom(roomId);
        
        await bot.editMessageText(
            `✅ Комната ${roomName} с id ${roomId} была успешно удалена! Было исключено игроков: ${players.size}`,
            {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id, 
            }
        );
        await bot.sendMessage(chatId, 'Выберите действие: ', mainRoomsKeyboard); //* Sending room default keyboard
    } catch (error) {
        logger.error(`Couldn't proccess callback from deleting a room ${roomId ? roomId : 'no such room exists'} ` +
            `by user ${userId}. Error: ` + error
        )
    }
}

async function handleRoomSettingsTextInput(bot, msg, globalStates, roomManager, roomDashboard) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    
    const roomSettingsState = globalStates.getRoomSettingsState(userId);
    if (!roomSettingsState) return;

    const roomId = globalStates.getUserRoomState(userId);
    const room = roomManager.getRoom(roomId);    
    
    if (!room) {
        await bot.sendMessage(chatId, '❌ Комната не найдена');
        globalStates.clearRoomSettingsState(userId);
        return;
    }

    try {
        switch (roomSettingsState) {
            case globalStates.ROOM_SETTINGS_STATES.AWAITING_ROOM_NAME:                           
                await _handleRoomNameInput(bot, msg, globalStates, roomManager, room, roomDashboard);
                break;
                
            case globalStates.ROOM_SETTINGS_STATES.AWAITING_MAX_PLAYERS:               
                await _handleMaxPlayersInput(bot, msg, globalStates, room, roomDashboard);
                break;
                
            case globalStates.ROOM_SETTINGS_STATES.AWAITING_PASSWORD:
                await _handlePasswordInput(bot, msg, globalStates, room, roomDashboard);
                break;
        }
    } catch (error) {
        logger.error(`Error handling room settings input for user ${userId}. Error: `, error);
        await bot.sendMessage(chatId, '❌ Произошла ошибка при изменении настроек');
        globalStates.clearRoomSettingsState(userId);
    }
}

async function _handleRoomNameInput(bot, msg, globalStates, roomManager, room, roomDashboard) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const newName = msg.text.trim();

    if (newName.length < 1 || newName.length > 15) {
        await bot.sendMessage(
            chatId, 
            '❌ Название должно содержать от 1 до 15 символов', {
            reply_markup: {
                inline_keyboard: [[
                    { text: '🔙 Назад', callback_data: 'change_room_settings:back' }
                ]]
            }
        });
        logger.warn(`The creator of room ${room.id} tried to change room name but it is gotta be [1, 15] symbols`);
        return;
    }
    
    const allRooms = roomManager.getAllRooms();
    const isNameTaken = allRooms.some((r) => 
        r.name.toLowerCase() === newName.toLowerCase()
    );

    if (isNameTaken) {
        await bot.sendMessage(
            chatId,
            '❌ Комната с таким названием уже существует. Введите другое название:', {
                reply_markup: {
                    inline_keyboard: [[
                        { text: '🔙 Назад', callback_data: 'change_room_settings:back' }
                    ]]
                }
            }
        );
        logger.warn(`The creator of room ${room.id} tried to change name of room ` +
            `from "${room.name}" to "${newName}" which is already taken`);
        return; 
    }

    const previousName = room.name;
    room.name = newName;

    globalStates.clearRoomSettingsState(userId);

    const updatedKeyboard = createChangeSettingsKeyboard(room);
    await bot.sendMessage(
        chatId,
        `✅ Название комнаты изменено: "${previousName}" → "${newName}"`,
        updatedKeyboard
    );
    logger.info(`User ${userId} changed room name from "${previousName}" to "${newName}" in room ${room.id}`);

    await roomDashboard.updateDashboardForAll(room.id);
}

async function _handleMaxPlayersInput(bot, msg, globalStates, room, roomDashboard) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;    
    const newMaxPlayers = parseInt(msg.text.trim());    

    if (isNaN(newMaxPlayers)) {
        await bot.sendMessage(
            chatId, 
            '❌ Введите корректное число от 3 до 20. Попробуйте еще раз:', {
            reply_markup: {
                inline_keyboard: [[
                    { text: '🔙 Назад', callback_data: 'change_room_settings:back' }
                ]]
            }
        });
        logger.warn(`The creator of room ${room.id} tried to change maximum players ` +
            `from ${room.maxPlayers} to ${newMaxPlayers} but it's either not a number`
        );
        return;
    }

    if (newMaxPlayers < 3 || newMaxPlayers > 20) {
        await bot.sendMessage(
            chatId, 
            '❌ Количество максимальных игроков должно быть диапазоне от 3 до 20', {
            reply_markup: {
                inline_keyboard: [[
                    { text: '🔙 Назад', callback_data: 'change_room_settings:back' }
                ]]
            }
        });
        logger.warn(`The creator of room ${room.id} tried to change maximum players ` +
            `from ${room.maxPlayers} to ${newMaxPlayers} but it's not in [3, 20] symbols`
        );
        return;
    }

    if (newMaxPlayers < room.getPlayersCount()) {
        await bot.sendMessage(`❌ Количество максимальных игроков должно быть больше, чем сейчас игроков в комнате > ${room.getPlayersCount()}`, {
            reply_markup: {
                inline_keyboard: [[
                    { text: '🔙 Назад', callback_data: 'change_room_settings:back' }
                ]]
            }
        });
        logger.warn(`The creator of room ${room.id} tried to change maximum players ` +
            `from ${room.maxPlayers} to ${newMaxPlayers} but it's gotta be more then current number of players`
        );
        return;
    }

    const previousMaxPlayers = room.settings.maxPlayers;
    room.settings.maxPlayers = newMaxPlayers;

    globalStates.clearRoomSettingsState(userId);

    const updatedKeyboard = createChangeSettingsKeyboard(room);
    await bot.sendMessage(
        chatId,
        `✅ Максимальное число игроков изменено: "${previousMaxPlayers}" → "${newMaxPlayers}"`,
        updatedKeyboard
    );
    logger.info(`User ${userId} changed room max players from "${previousMaxPlayers}" to "${newMaxPlayers}" in room ${room.id}`);

    await roomDashboard.updateDashboardForAll(room.id);
}

async function _handlePasswordInput(bot, msg, globalStates, room, roomDashboard) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const newPassword = msg.text.trim();

    if (newPassword.length < 1 || newPassword.length > 10) {
        await bot.sendMessage(
            chatId, 
            '❌ Пароль должен содержать от 1 до 10 символов', {
            reply_markup: {
                inline_keyboard: [[
                    { text: '🔙 Назад', callback_data: 'change_room_settings:back' }
                ]]
            }
        });
        logger.warn(`The creator of room ${room.id} tried to change/set password ` +
            `from ${room.settings.password} to ${newPassword} but it's not in [1, 10] symbols`
        );
        return;
    }

    const previousPassword = room.settings.password;
    room.settings.password = newPassword;
    room.settings.isPrivate = true;

    globalStates.clearRoomSettingsState(userId);

    const updatedKeyboard = createChangeSettingsKeyboard(room);
    await bot.sendMessage(
        chatId,
        `✅ Пароль изменен: "${previousPassword}" → "${newPassword}"`,
        updatedKeyboard
    );

    logger.info(`User ${userId} changed room password from "${previousPassword}" to "${newPassword}" in room ${room?.id}. ` + 
        `Now this room is private: ${room.settings.isPrivate}`);

    await roomDashboard.updateDashboardForAll(room.id);
}
module.exports = {
    handleChooseGame,
    handleStartGame,
    handleRoomSettings,
    handleKickPlayer,
    handleDeleteRoom,
    handleLeaveRoom,
    handleRefreshDashboard,

    handleChoosingGameCallbackQuery,
    handleChangingSettingsCallbackQuery,
    handleKickPlayerCallbackQuery,
    handleDeleteRoomCallbackQuery,

    handleRoomSettingsTextInput,

    handleSetReady
}