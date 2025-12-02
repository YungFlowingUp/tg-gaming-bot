const { handleStart } = require('./commandHandlers/startCommandHandler');
const { handleShowId } = require('./commandHandlers/showIdCommandHandler');
const { handleBegin } = require('./commandHandlers/beginCommandHandler');
const { 
    handleAdminPanel, handleShowAdmins, handleAddAdmin, 
    handleAddSuperAdmin, handleAdminTextMessage, handleRemoveAdmin,
    handleAdminCallbackQuery
} = require('./commandHandlers/adminPanelHandler');
const { 
    handleCreateRoom, handleEnterCurrentUserRoom, 
    handleShowListOfRooms, handleRoomsListCallbackQuery 
} = require('./commandHandlers/roomsManagerHandler');
const { 
    handleChooseGame, handleStartGame, handleRoomSettings, 
    handleChoosingGameCallbackQuery, handleChangingSettingsCallbackQuery,
    handleRoomSettingsTextInput, handleKickPlayer, handleKickPlayerCallbackQuery,
    handleDeleteRoom, handleDeleteRoomCallbackQuery, handleLeaveRoom,
    handleSetReady, handleRefreshDashboard
} = require('./commandHandlers/roomCommandHandler');


function registerAllHandlers(bot, globalStates, roomManager, roomDashboard) {       
    //* SLASH COMMANDS
    bot.onText(/\/start/, (msg) => handleStart(bot, msg, globalStates)); //! ANY
    bot.onText(/\/showid/, (msg) => handleShowId(bot, msg)); //! ANY
    bot.onText(/\/begin/, (msg) => handleBegin(bot, msg, globalStates));  //! ADMINS only!
    bot.onText(/\/admin/, (msg) => handleAdminPanel(bot, msg, globalStates)); //! SUPER-ADMINS only!

    //* ROOMS MANAGER
    bot.onText(/➕ Создать комнату/, (msg) => handleCreateRoom(bot, msg, globalStates, roomManager, roomDashboard));
    bot.onText(/🚪 Моя комната/, (msg) => handleEnterCurrentUserRoom(bot, msg, globalStates, roomManager));
    bot.onText(/📊 Список комнат/, (msg) => handleShowListOfRooms(bot, msg, globalStates, roomManager));
    
    //* INSIDE ROOM (CREATOR)
    bot.onText(/🎮 Выбрать игру/, (msg) => handleChooseGame(bot, msg, globalStates, roomManager));
    bot.onText(/🚀 Начать игру/, (msg) => handleStartGame(bot, msg, globalStates, roomManager));
    bot.onText(/⚙️ Настройки комнаты/, (msg) => handleRoomSettings(bot, msg, globalStates, roomManager));
    bot.onText(/👥 Кикнуть игрока/, (msg) => handleKickPlayer(bot, msg, globalStates, roomManager));
    bot.onText(/🗑️ Удалить комнату/, (msg) => handleDeleteRoom(bot, msg, globalStates, roomManager));
    bot.onText(/🔙 Выйти из комнаты/, (msg) => handleLeaveRoom(bot, msg, globalStates, roomManager, roomDashboard));

    //* INSIDE ROOM (USER)    
    bot.onText(/🟢 Готов/, (msg) => handleSetReady(bot, msg, globalStates, roomManager, roomDashboard));
    bot.onText(/🔴 Не готов/, (msg) => handleSetReady(bot, msg, globalStates, roomManager, roomDashboard));
    
    //* INSIDE ROOM (USER + CREATER)
    bot.onText(/🔄 Показать дашборд/, (msg) => handleRefreshDashboard(bot, msg, globalStates, roomManager, roomDashboard));

    //* ADMIN PANEL
    bot.onText(/🔙 В главное меню/, (msg) => handleStart(bot, msg, globalStates)); //! ANY
    bot.onText(/👥 Список админов/, (msg) => handleShowAdmins(bot, msg)); //! SUPER-ADMINS only!
    bot.onText(/➕ Добавить админа/, (msg) => handleAddAdmin(bot, msg, globalStates)); //! SUPER-ADMINS only!
    bot.onText(/👑 Добавить суперадмина/, (msg) => handleAddSuperAdmin(bot, msg, globalStates)); //! SUPER-ADMINS only!
    bot.onText(/➖ Удалить админа/, (msg) => handleRemoveAdmin(bot, msg, globalStates)); //! SUPER-ADMINS only!

    //* Handler for removing inline buttons 
    bot.on('callback_query', (callbackQuery) => {
        const data = callbackQuery.data;
        if (data.startsWith('admin')) { //* Admin Panel
            handleAdminCallbackQuery(bot, callbackQuery, globalStates); //! SUPER-ADMINS only!
        } else if (data.startsWith('rooms')) { //* RoomManager - entering a room
            handleRoomsListCallbackQuery(bot, callbackQuery, globalStates, roomManager, roomDashboard);
        } else if (data.startsWith('choosing_game')) { //* Choosing a game inside room            
            handleChoosingGameCallbackQuery(bot, callbackQuery, globalStates, roomManager, roomDashboard);
        } else if (data.startsWith('change_room_settings')) { //* Changing settings of a room 
            handleChangingSettingsCallbackQuery(bot, callbackQuery, globalStates, roomManager, roomDashboard);
        } else if (data.startsWith('kick_player')) { //* Kicking a player
            handleKickPlayerCallbackQuery(bot, callbackQuery, globalStates, roomManager, roomDashboard);
        } else if (data.startsWith('room_confirmation_deleting')) { //* Deleting a room
            handleDeleteRoomCallbackQuery(bot, callbackQuery, globalStates, roomManager, roomDashboard);
        }
    });
    
    
    bot.on('message', (msg) => {             
        if (msg.text && !msg.text.startsWith('/')) {
            const userId = msg.from.id;
            const userAdminState = globalStates.getAdminState(userId);
            const userRoomSettingsState = globalStates.getRoomSettingsState(userId);
            //* Handler for admin panel typing inputs
            if (userAdminState) {
                handleAdminTextMessage(bot, msg, globalStates); //! SUPER-ADMINS only!
            } else if (userRoomSettingsState) {
                handleRoomSettingsTextInput(bot, msg, globalStates, roomManager, roomDashboard);
            }
        }
    });
}

module.exports = { registerAllHandlers };