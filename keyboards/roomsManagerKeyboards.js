const gameSelectionKeyboard = {
    reply_markup: {
        keyboard: [
            ['🎩Шляпа🎩' ],
            ['🕵🏻‍♂️Шпион🕵🏻‍♂️'],
            ['☢️Бункер☢️']
        ],
        resize_keyboard: true,
        input_field_placeholder: "Выберите игру из списка...",
        one_time_keyboard: false 
    }
};

const mainRoomsKeyboard = {
     reply_markup: {
        keyboard: [
            ['➕ Создать комнату'],
            ['🚪 Моя комната'], 
            ['📊 Список комнат']
        ],
        resize_keyboard: true,
        input_field_placeholder: "Управление комнатами...",
        one_time_keyboard: true
    }
}

function createRoomsListKeyboard(rooms) {
    const keyboard = [];
    
    for (let i = 0; i < rooms.length; i++) {
        const row = [];
        
        if (rooms[i]) {
            const currentGame = !!rooms[i].game ? rooms[i].game : 'Не выбрана';
            const isPlaying = rooms[i].status === 'waiting' ? '😴' : '🎮'; 
            const isPrivate = !!rooms[i].settings.isPrivate ? '🔒' : '';
            row.push({
                text: `${isPlaying} ${isPrivate} ${rooms[i].name} (${rooms[i].getPlayersCount()}) [${currentGame}]`,
                callback_data: `rooms_enter:${rooms[i].id}`
            });
        }
        
        keyboard.push(row);
    }

    keyboard.push([
        {
            text: '🔙 Назад',
            callback_data: 'rooms_back_to_main'
        }
    ]);
    
    return keyboard;
}

module.exports = {
    gameSelectionKeyboard,
    mainRoomsKeyboard,
    createRoomsListKeyboard
};