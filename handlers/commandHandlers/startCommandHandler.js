const path = require('path');
const fs = require('fs').promises;
const { gameSelectionKeyboard } = require('../../keyboards/generalKeyboards');

async function handleStart(bot, msg, globalStates) {
    const chatId = msg.chat.id;

    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name;

    const isNewPlayer = !globalStates.players.some(player => player[1] === userId);
    
    if (isNewPlayer) {    
        //* Adding a new player to the global state 
        globalStates.players.push([globalStates.playersIDCounter, userId, username]);
        globalStates.playersIDCounter++; //* Incrementing ID counter

        try { //* Trynna send an image 
            //* Sending a meme
            const imagesDirPath = path.join(__dirname, '../../images');
            
            const files = await fs.readdir(imagesDirPath);

            const randomIndex = Math.floor(Math.random() * files.length);
            const randomFileName = files[randomIndex];
            const imagePath = path.join(imagesDirPath, randomFileName);

            await bot.sendPhoto(chatId, imagePath)
                .catch(error => {
                    console.error('Error sending an image:', error);
                });
            
            //* Sending confirmation with game selector
            await bot.sendMessage(chatId, "😱Добро пожаловать на учёт!😱", gameSelectionKeyboard);
        } catch (error) {
            console.error('Error:', error);            
            await bot.sendMessage(chatId, "😱Добро пожаловать на учёт!😱", gameSelectionKeyboard);
        }
        
        console.log(globalStates.players); 
    } else {
        await bot.sendMessage(chatId, "🤭Вы уже на учёте!🤭", gameSelectionKeyboard);
    }
}

module.exports = { handleStart };