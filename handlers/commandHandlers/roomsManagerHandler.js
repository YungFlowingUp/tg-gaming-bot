const { mainRoomsKeyboard, createRoomsListKeyboard } = require('../../keyboards/roomsManagerKeyboards');
const globalConfig = require('../../configs/globalConfig');
const logger = require('../../utils/logger');
const { roomCreatorKeyboard, createUsersKeyboard } = require('../../keyboards/roomKeyboards');
const { isAdmin } = require('../../utils/permissions');

async function handleCreateRoom(bot, msg, globalStates, roomManager, roomDashboard) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    if (!globalConfig.rooms.enabled) {
        logger.error(`Room creation is disabled!`);
        await bot.sendMessage(chatId, '❌ Создание комнат запрещено!');
        return;
    }
    try {
        if (globalStates.getUserRoomState(userId)) {
            await bot.sendMessage(
                chatId, 
                '❌ Вы не можете создать новую комнату!\n' +
                `Вы уже находитесь в комнате ${roomManager.getRoom(globalStates.getuUerRoomStates(userId))}!\n` +
                'Нажмите 🚪 Моя комната, чтобы попасть к себе в комнату',
                mainRoomsKeyboard
            );
            logger.warn(`The user ${userId} tried to create new room while he's in a room already`);
            return;
        }
        const username = msg.from.username;
        const roomName = `Комната ${username.length > 12 ? username.substr(0, 12) + '...' : username}`;
        
        const room = roomManager.createRoom(roomName, userId.toString());
        roomManager.addUserToRoom(userId, room.id, {
            username: username,
            isReady: true,
            isCreator: true
        });
        if (room) {
            await bot.sendMessage(
                chatId,
                `✅ Комната "${roomName}" успешно создана!\n` +
                `Создатель: @${msg.from.username}`,
                roomCreatorKeyboard
            );

            await roomDashboard.createOrUpdateDashboard(userId, room.id);
            globalStates.setUserRoomState(userId, room.id);          
        } else {
            await bot.sendMessage(
                chatId,
                '❌ Не удалось создать комнату. Возможно, достигнут лимит комнат.'
            );
        }
    } catch (error) {
        logger.error(`Error creating room by user ${userId}:`, error);
        await bot.sendMessage(
            chatId,
            '❌ Произошла ошибка при создании комнаты.'
        );
    }
}

async function handleEnterCurrentUserRoom(bot, msg, globalStates, roomManager) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    const roomId = globalStates.getUserRoomState(userId);
    const room = roomManager.getRoom(roomId);
            
    if (!room) {
        await bot.sendMessage(
            chatId, 
            '❌ Комната не найдена.\nВойдите в уже существующую или создайте новую', 
            mainRoomsKeyboard
        );
        logger.warn(`The user couldn't get back to his room... Maybe craeter deleted this room already or user got kicked`);
        return;
    }
    if (room.createdBy === userId.toString()) { //* Creater getting back to his room
        await bot.sendMessage(chatId, 'Вы вернулись в свою комнату', roomCreatorKeyboard);
    } else { //* Player new to this room
        const userKeyboard = createUsersKeyboard(room.getPlayer(userId).isReady, await isAdmin(userId));
        await bot.sendMessage(chatId, 'Вы вернулись в свою комнату', userKeyboard);
    } 
    
}

async function handleShowListOfRooms(bot, msg, globalStates, roomManager) {       
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    
    const rooms = roomManager.getAllRooms();
    
    if (rooms.length === 0) {
        await bot.sendMessage(
            chatId,
            '📭 Список комнат пуст.\n\n' +
            'Создайте первую комнату, нажав кнопку "➕ Создать комнату"'
        );
        logger.debug(`User ${userId} tried to see room list, but no room was created yet`);
        return;
    }
    
    const keyboard = createRoomsListKeyboard(rooms);    
    await bot.sendMessage(
        chatId,
        `📊 Список комнат (${rooms.length}):\n\n` +
        '(Количество учаснтиков), [Текущая игра]\n' +
        '🎮 - идет игра. 😴 - не идет игра\n' + 
        'Нажмите на комнату, чтобы присоединится',
        {
            reply_markup: {
                inline_keyboard: keyboard
            }
        }
    );
    logger.debug(`The list of all room was shown to user ${userId}`);
}

async function handleRoomsListCallbackQuery(bot, callbackQuery, globalStates, roomManager, roomDashboard) {    
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    
    await bot.answerCallbackQuery(callbackQuery.id); //* Remove loading

    try {
        if (data === 'rooms_back_to_main') {
            //* Back to main menu
            await bot.editMessageText('🏠 Главное меню', {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                reply_markup: {
                    inline_keyboard: [] // или клавиатура главного меню
                }
            });
            logger.debug(`The user ${userId} exits the list of rooms`); //? Logging user exits the room list
        } 
        else if (data.startsWith('rooms_enter')) {           
            const roomId = data.split(":")[1];
            const room = roomManager.getRoom(parseInt(roomId));
            
            if (!room) {
                await bot.editMessageText('❌ Комната не найдена', {
                    chat_id: chatId,
                    message_id: callbackQuery.message.message_id,
                    inline_keyboard: []
                });
                return;
            }
            logger.debug(`The user ${userId} chose the room ${room.id}`);
            
            await bot.deleteMessage(chatId, callbackQuery.message.message_id);

            try {
                if (!room.getPlayer(userId)) { //* If user new to room
                    if (room.status !== 'waiting') {
                        await bot.sendMessage(
                            userId, 
                            '❌ В данный момент в комнате играют!\n' +
                            'Выберети другую комнату или создайте свою',
                            mainRoomsKeyboard
                        );
                        logger.warn(`The user ${userId} tried to get in room, while the room was playing`);
                        return;
                    }

                    roomManager.addUserToRoom(userId, room.id, {
                        username: callbackQuery.from.username,
                        isReady: false,
                        isCreator: room.createdBy === userId.toString()
                    });
                    
                    const userKeyboard = createUsersKeyboard(room.getPlayer(userId).isReady, await isAdmin(userId)); // const userKeyboard = createUsersKeyboard();
                    await bot.sendMessage(
                        chatId,
                        `🎪 Вы вошли в комнату: "${room.name}"\n` +
                        `Выберите действие:`,
                        userKeyboard
                    );
                    logger.debug(`The user ${userId} smoothly got in the room ${room.id}`);

                    await roomDashboard.updateDashboardForAll(room.id);                    
                    globalStates.setUserRoomState(userId, room.id);                
                } 
                else { //* Player already in this room                        
                    if (room.createdBy === userId.toString()) { //* Creator getting back to his room
                        await bot.sendMessage(chatId, 'Вы уже в этой комнате!', roomCreatorKeyboard);
                    } else { //* User getting back to his room
                        const userKeyboard = createUsersKeyboard(room.getPlayer(userId).isReady, await isAdmin(userId));
                        await bot.sendMessage(chatId, 'Вы уже в этой комнате!', userKeyboard);
                    }                    
                }
            } catch(error) {
                logger.error(`Failed adding user to room: ${room.id}. Error: `, error);
                await handleShowListOfRooms(bot, msg, globalStates, roomManager);
            }
        }
        
    } catch (error) {
        logger.error(`Error in room callback for user ${userId}:`, error);
        await bot.editMessageText('❌ Произошла ошибка', {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                reply_markup: { inline_keyboard: [] }
        });
    }
}

module.exports = {
    handleCreateRoom,
    handleEnterCurrentUserRoom,
    handleShowListOfRooms,
    handleRoomsListCallbackQuery
}