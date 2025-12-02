const gameSelectionKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [ { text: '🎩Шляпа🎩', callback_data: 'choosing_game:🎩Шляпа🎩'} ],
            [ { text: '🕵🏻‍♂️Шпион🕵🏻‍♂️', callback_data: 'choosing_game:🕵🏻‍♂️Шпион🕵🏻‍♂️'} ],
            [ { text: '☢️Бункер☢️', callback_data: 'choosing_game:☢️Бункер☢️'} ],
            [ 
                { text: '💨Пусто💨', callback_data: 'choosing_game:null'},
                { text: '🔙 Выйти из режима выбора', callback_data: 'choosing_game:cancel'},
            ],
        ]
    }
};

const roomCreatorKeyboard = {
    reply_markup: {
        keyboard: [
            ['🔄 Показать дашборд'],
            ['🎮 Выбрать игру', '🚀 Начать игру'],
            ['⚙️ Настройки комнаты', '👥 Кикнуть игрока'],
            ['🗑️ Удалить комнату', '🔙 Выйти из комнаты']
        ],
        resize_keyboard: true,
        input_field_placeholder: "Управление комнатами...",
        one_time_keyboard: false
    }
}

const roomConfirmationKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [
                { text: '✅ Да', callback_data: 'room_confirmation_deleting:confirm'},
                { text: '❌ Нет', callback_data: 'room_confirmation_deleting:cancel'},
            ]
        ]
    }
}

function createUsersKeyboard(isReady, isAdmin = false) {
    const keyboard = {
        reply_markup: {
            keyboard: [
                ['🔄 Показать дашборд'],
                [`${isReady ? '🟢 Вы готовы 🟢' : '🔴 Вы не готовы 🔴'}`],
                ['🟢 Готов', '🔴 Не готов'],
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    }
    if (isAdmin) {
        keyboard.reply_markup.keyboard.push(['👥 Кикнуть игрока', '🔙 Выйти из комнаты']);
    } else {
        keyboard.reply_markup.keyboard.push(['🔙 Выйти из комнаты']);
    }
    return keyboard
}

function createChangeSettingsKeyboard(room) {
    const keyboard = [
        [ { text: `Название [${room.name}]`, callback_data: 'change_room_settings:name'} ],
        [ { text: `Max игроков [${room.settings.maxPlayers}]`, callback_data: 'change_room_settings:max_players'} ]
    ];

    if (room.settings.isPrivate) { //* If a room already has a password
        keyboard.push([
            { text: `Сменить пароль`, callback_data: 'change_room_settings:set_password' },
            { text: '❌ Удалить пароль', callback_data: 'change_room_settings:remove_password' }
        ]);
    } else { //* If no password yet
        keyboard.push([
            { text: '🔒 Запаролить', callback_data: 'change_room_settings:set_password' }
        ]);
    }

    keyboard.push([
        { text: '🔙 Выйти из настроек', callback_data: 'change_room_settings:cancel'}
    ]);
    return {
        reply_markup: {
            inline_keyboard: keyboard
        } 
    }
}

function createPlayersInRoomKeyboard(players) {
    const keyboard = [];

    for (const [playerId, playerData] of players) {
        keyboard.push([ 
            { text: `${playerData.username} (${playerId})`, callback_data: `kick_player:${playerId}` } 
        ]);
    }
    keyboard.push([
        { text: "🔙 Выйти из киканья", callback_data: "kick_player:cancel" } 
    ]);
    
    return {
        reply_markup: {
            inline_keyboard: keyboard
        }
    }
}

module.exports = {
    gameSelectionKeyboard,
    roomCreatorKeyboard,
    roomConfirmationKeyboard,
    createUsersKeyboard,
    createChangeSettingsKeyboard,
    createPlayersInRoomKeyboard
}