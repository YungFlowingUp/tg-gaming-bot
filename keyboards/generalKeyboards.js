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



module.exports = {
    gameSelectionKeyboard
};