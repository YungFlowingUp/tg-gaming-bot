const logger = require("../utils/logger");

class RoomDashboard {
    constructor(bot, roomManager) {
        this.bot = bot;
        this.roomManager = roomManager;
        this.dashboards = new Map(); // roomId -> Map(userId -> messageId)
    }

    async createOrUpdateDashboard(userId, roomId) {
        const room = this.roomManager.getRoom(roomId);
        if (!room) return null;  
        
        const chatId = userId;
        const dashboardInfo = this.getDashboardInfo(room, userId); 
        
        const existingMessageId = this.#getUserDashboardMessageId(userId, roomId);
        if (existingMessageId) { //* Creating dashboard
            await this.updateExistingDashboard(chatId, existingMessageId, dashboardInfo);            
        } else { //* Updating dashboard
            await this.createNewDashboard(chatId, userId, roomId, dashboardInfo);            
        }
    }

    getDashboardInfo(room, currentUserId) {
        const players = room.players;
        const readyPlayers = room.getReadyPlayers();
        const currentTime = new Date().toLocaleTimeString();
        
        let playerList = ''; 

        for (const [playerId, playerData] of players) {                       
            const isStatusReady = playerData.isReady ? '🟢' : '🔴';
            
            const isCreator = playerId == room.createdBy;
            const creatorIcon = isCreator ? '👑' : '👤';

            const isCurrentUser = playerId === currentUserId; 
            const currentUserMarker = isCurrentUser ? ' (Вы)' : '';

            playerList += `${creatorIcon} ${playerData.username}${currentUserMarker} ${isStatusReady}\n`;
        }
        return `🎪 Комната "${room.name}" [${room.id}]\n` +
                `${room.settings.isPrivate ? "🔒 Пароль установлен\n" : ""}` + //* Displaying only if has password
                `👥 Игроки: ${players.size}/${room.settings.maxPlayers} | 🟢 Готовы: ${readyPlayers.size}\n` +
                `────────────────\n` +
                `${playerList}` +
                `────────────────\n` +
                `🎮 Игра: ${room.game || 'Не выбрана'}\n` +
                `⏰ Обновлено: ${currentTime}`
    }

    async createNewDashboard(chatId, userId, roomId, dashboardInfo) {
        try {
            const message = await this.bot.sendMessage(chatId, dashboardInfo);
            logger.debug(`Dashboard message was created for user ${userId} in room ${roomId}. Message id is ${message.message_id}`);
            this.#setUserDashboardMessageId(userId, roomId, message.message_id);            
        } catch (error) {
            logger.error(`Error creating dashboard for user ${userId}:`, error);
        }
    }


    async updateExistingDashboard(chatId, messageId, dashboardInfo) {
        try {
            await this.bot.editMessageText(dashboardInfo, {
                chat_id: chatId,
                message_id: messageId,
            });
            logger.debug(`Dashboard message was updated for user ${chatId}. Message id is ${messageId}`);
        } catch (error) {
            logger.error(`Error updating dashboard:`, error);
        }
    }

    #removeUserDashboard(userId, roomId) {
        const roomDashboards = this.dashboards.get(roomId);
        if (roomDashboards) {
            logger.debug(`Dashboard message state was deleted for user ${userId} and message ${roomDashboards.get(userId)}`);
            roomDashboards.delete(userId);            
            if (roomDashboards.size === 0) {
                logger.debug(`Dashboard message state was deleted for room ${roomId}`);
                this.dashboards.delete(roomId);
            }
        }
    }

    #setUserDashboardMessageId(userId, roomId, messageId) {
        if (!this.dashboards.has(roomId)) {
            this.dashboards.set(roomId, new Map());
        }
        this.dashboards.get(roomId).set(userId, messageId);
        logger.debug(`Dashboard messsage state kept for user ${userId} in room ${roomId} with message ${messageId}`);
    }

    #getUserDashboardMessageId(userId, roomId) {               
        return this.dashboards?.get(roomId)?.get(userId);
    }

    async updateDashboardForAll(roomId) {
        const room = this.roomManager.getRoom(roomId);
        if (!room) return;

        const players = room.players;
        
        for (const [playerId, playerData] of players) {
            await this.createOrUpdateDashboard(playerId, roomId);
        }
    }

    async removeDashboardForUser(userId, roomId) {
        const messageId = this.#getUserDashboardMessageId(userId, roomId);
        if (messageId) {
            try {
                await this.bot.deleteMessage(userId, messageId);
                logger.debug(`Dashboard message was deleted for user ${userId} from room ${roomId}`);
            } catch (error) {
                logger.error(`Error deleting dashboard for user ${userId} in room ${roomId}:`, error);
            }
        }

        this.#removeUserDashboard(userId, roomId);
    }
}

module.exports = RoomDashboard;