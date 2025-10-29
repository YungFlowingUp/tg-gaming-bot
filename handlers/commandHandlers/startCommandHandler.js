const path = require('path');
const fs = require('fs').promises;
const logger = require('../../utils/logger');
const { gameSelectionKeyboard } = require('../../keyboards/generalKeyboards');

async function handleStart(bot, msg, globalStates) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name;

    //? Logging user started a new chat
    logger.info(`User ${username} with userId ${userId} started bot in chat ${chatId}`);

    const isNewPlayer = !globalStates.players.some(player => player[1] === userId);
    
    if (isNewPlayer) {    
        //* Adding a new player to the global state 
        globalStates.players.push([globalStates.playersIDCounter, userId, username]);
        globalStates.playersIDCounter++; //* Incrementing ID counter 
        
        //? Logging a new player information
        logger.debug(`New player registered: ${username} (${userId}) with ID ${globalStates.playersIDCounter}`);
        logger.debug(`Total players count: ${globalStates.players.length}`);

        try { //* Trynna send an image 
            const imagesDirPath = path.join(__dirname, '../../images');
            
            const files = await fs.readdir(imagesDirPath);

            const randomIndex = Math.floor(Math.random() * files.length);
            const randomFileName = files[randomIndex];
            const imagePath = path.join(imagesDirPath, randomFileName);

            await bot.sendPhoto(chatId, imagePath)
                .catch(error => {
                    logger.error(`Failed to send image ${randomFileName} to user ${userId} with error: ${error}`); //? Logging the error
                });
            
            //* Sending confirmation with game selector
            await bot.sendMessage(chatId, "😱Добро пожаловать на учёт!😱", gameSelectionKeyboard);
            
            //? Logging confirmation that user has got a welcome message
            logger.debug(`Welcome message sent to new user ${userId} with photo ${randomFileName}`);
        } catch (error) {
            await bot.sendMessage(chatId, "😱Добро пожаловать на учёт!😱", gameSelectionKeyboard);

            logger.warn(`The user ${userId} has got welcome message without a photo. ChatID ${chatId}`); //? Logging user has got no photo
        }        
    } else {
        await bot.sendMessage(chatId, "🤭Вы уже на учёте!🤭", gameSelectionKeyboard);
        
        logger.debug(`User ${ userId} was already registered`); //? Logging that user was already registered
    }
}

module.exports = { handleStart };