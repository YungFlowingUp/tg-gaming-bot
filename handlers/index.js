const { handleStart } = require('./commandHandlers/startCommandHandler');
const { handleShowId } = require('./commandHandlers/showIdCommandHandler');
const { handleBegin } = require('./commandHandlers/beginCommandHandler');
const { 
    handleAdminPanel, handleShowAdmins, handleAddAdmin, 
    handleAddSuperAdmin, handleAdminTextMessage, handleRemoveAdmin,
    handleAdminCallbackQuery
} = require('./commandHandlers/adminPanelHandler');

function registerAllHandlers(bot, globalStates) {
    bot.onText(/\/start/, (msg) => handleStart(bot, msg, globalStates));
    bot.onText(/\/showid/, (msg) => handleShowId(bot, msg));
    bot.onText(/\/begin/, (msg) => handleBegin(bot, msg, globalStates));  //! ADMINS only!
    bot.onText(/\/admin/, (msg) => handleAdminPanel(bot, msg, globalStates)); //! SUPER-ADMINS only!

    bot.onText(/🔙 В главное меню/, (msg) => handleStart(bot, msg, globalStates)); //TODO NO MAIN MAIN KEYBOARD Пока что просто вставание в очередь!
    bot.onText(/👥 Список админов/, (msg) => handleShowAdmins(bot, msg)); //! SUPER-ADMINS only!
    bot.onText(/➕ Добавить админа/, (msg) => handleAddAdmin(bot, msg, globalStates)); //! SUPER-ADMINS only!
    bot.onText(/👑 Добавить суперадмина/, (msg) => handleAddSuperAdmin(bot, msg, globalStates)); //! SUPER-ADMINS only!
    bot.onText(/➖ Удалить админа/, (msg) => handleRemoveAdmin(bot, msg, globalStates)); //! SUPER-ADMINS only!

    //* Handler for removing inline buttons 
    bot.on('callback_query', (callbackQuery) => {
        handleAdminCallbackQuery(bot, callbackQuery, globalStates);
    });
    
    //* Handler for admin panel typing inputs
    bot.on('message', (msg) => {
        if (msg.text && !msg.text.startsWith('/')) {
            handleAdminTextMessage(bot, msg, globalStates); //! SUPER-ADMINS only!
        }
    });
}

module.exports = { registerAllHandlers };