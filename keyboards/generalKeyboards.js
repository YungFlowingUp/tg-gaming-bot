const gameSelectionKeyboard = {
    reply_markup: {
        keyboard: [
            [{ text: '🎩Шляпа🎩' }],
            [{ text: '🕵🏻‍♂️Шпион🕵🏻‍♂️' }],
            [{ text: '☢️Бункер☢️' }]
        ],
        resize_keyboard: true,
        one_time_keyboard: true //TODO |Can be changed????|
    }
};

module.exports = {
    gameSelectionKeyboard
};