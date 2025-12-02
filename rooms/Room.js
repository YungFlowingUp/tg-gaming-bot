const globalConfig = require("../configs/globalConfig");
const logger = require("../utils/logger");

class Room {
    constructor(id, name, createdBy, options = {}) {
        this.id = id;
        this.name = name;
        this.createdBy = createdBy;
        this.createdAt = new Date();
        this.game = null; //* Current game in the room
        this.status = 'waiting'; //* Playing or not
        this.players = new Map(); //* userId -> playerData
        this.settings = {
            maxPlayers: options.maxPlayers || globalConfig.rooms.defaultMaxPlayers,
            isPrivate: options.isPrivate || false, //* If private, has a password
            password: options.password || null,
            ...options //TODO MAYBE DELETED
        };
    }

    addPlayer(userId, playerData) {
        if (this.players.size >= this.settings.maxPlayers) {
            throw new Error('Room is overflowing');
        }
        
        if (this.players.has(userId)) {
            throw new Error('This player already in this room');
        }

        this.players.set(userId, { 
            isReady: false,
            ...playerData, 
            joinedAt: new Date()            
        });
        
        return true;
    }

    getPlayersCount() {
        return this.players.size;
    }

    isPlayerInRoom(userId) {
        return this.players.has(userId);
    }

    removePlayer(userId) {             
        const player = this.players.get(userId);        
        
        if (player) {
            //* If the player was creator of the room, making an other player creator
            if (this.createdBy === userId.toString() && this.players.size > 1) {                
                const otherPlayers = Array.from(this.players)
                    .filter(([id, playerData]) => id !== userId);

                logger.info(`Craetor of room ${this.name} with id ${this.id} changed from ${this.createdBy} to ${otherPlayers[0][0]}`); //? Logging changing of creator of a room
                this.createdBy = otherPlayers[0][0];
            }
        } else {
            throw new Error('No such player in the room');
        }
        logger.info(`The player ${userId} was removed from the room ${this.id}`);
        this.players.delete(userId);               
    }

    getPlayer(userId) {
        if (this.isPlayerInRoom) {
            return this.players.get(userId);
        } else {
            return null
        }        
    }

    isEmpty() {
        return this.players.size === 0;
    }

    getReadyPlayers() { //* Returns Map
        const readyPlayers = new Map();
        Array.from(this.players)
            .filter(([playerId, playerData]) => playerData.isReady)
            .map((player) => readyPlayers.set(player[0], player[1]));

        return readyPlayers;
    }
}

module.exports = Room;