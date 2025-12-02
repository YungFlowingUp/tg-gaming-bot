const Room = require('./Room');
const globalConfig = require('../configs/globalConfig');
const logger = require('../utils/logger');

class RoomManager {
    #roomIdCounter = 1; 
    constructor() {
        this.rooms = new Map();
    }

    createDefault() {
        const room = new Room(
            globalConfig.rooms.defaultRoomId, 
            'Главная комната', 
            'system'
        );

        this.rooms.set(globalConfig.rooms.defaultRoomId, room);
        logger.info(`Default room was created`);
        return true
    }

    createRoom(name, createdBy, options = {}) {      
        if (this.rooms.size >= globalConfig.rooms.maxRooms) {
            logger.error(`The room limit is reached. Current max limit = ${globalConfig.rooms.maxRooms}`);
            return false
        }
        const id = this.#roomIdCounter;
        
        const room = new Room(id, name, createdBy, options);
        this.rooms.set(id, room);        
        logger.info(`The room with id [${id}] and name [${name}] has been created by [${createdBy}]`);

        this.#roomIdCounter++;
        return room;
    }

    getAllRooms() {
        return Array.from(this.rooms.values());
    }

    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    
    addUserToRoom(userId, roomId, playerData) {
        const room = this.getRoom(roomId);
        if (!room) {
            throw new Error(`Комната "${roomId}" не найдена`);
        }

        //* Just for the record
        this.removeUserFromAllRooms(userId);
        
        room.addPlayer(userId, playerData);
        
        logger.info(`Player ${userId} was added to room ${room.name}. Room id is ${room.id}`);
        return room;
    }

    removeUserFromAllRooms(userId) {
        for (const [roomId, room] of this.rooms.entries()) {
            if (room.isPlayerInRoom(userId)) {
                room.removePlayer(userId);
                if (room.isEmpty()) {
                    this.deleteRoom(roomId);
                }
            }
        }
    }

    deleteRoom(roomId) {
        if (roomId === globalConfig.rooms.defaultRoomId) {
            logger.error('Cannot delete default room');
            return;
        }
        
        logger.info(`The room ${this.rooms.get(roomId).name} with id ${roomId} was deleted`);
        this.rooms.delete(roomId);
    }
}

module.exports = RoomManager;