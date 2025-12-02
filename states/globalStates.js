const logger = require('../utils/logger');

class GlobalStates { // userId = integer; roomId = integer
    //* Admin-panel states
    #adminPanelStates = new Map(); //* Format: (userId -> 'awaiting_admin_id' | 'confirming_admin_add') 
    ADMIN_STATES = {
        AWAITING_ADMIN_ID: 'awaiting_admin_id',
        AWAITING_SUPERADMIN_ID: 'awaiting_superadmin_id'
    };

    //* User's room states
    #userRoomStates = new Map(); //* Format: (userId -> roomId)   

    //* Changing settings of a room states
    #roomSettingsStates = new Map(); //* Format: (userId -> state)
    ROOM_SETTINGS_STATES = {
        AWAITING_ROOM_NAME: 'awaiting_room_name',
        AWAITING_MAX_PLAYERS: 'awaiting_max_players', 
        AWAITING_PASSWORD: 'awaiting_password'
    }; 
    
    constructor(){
        this.players = []; //* For checking - is a new player
        this.botStartedAt = Date.now();
    }

    // ---------------- ADMIN STATES ---------------- //
    setAdminState(userId, state) {
        this.#adminPanelStates.set(userId, state);
        logger.debug(`Admin state set for user ${userId}, state: ${state}`); //? Logging setting adminState

        //* Autoclearing in 10 mins
        setTimeout(() => {
            if (this.#adminPanelStates.get(userId) === state) {
                logger.debug(`Admin state autocleared (10 minutes left) for user ${userId}, state: ${state}`); //? Logging autodeleting adminState
                delete adminPanelStates[userId];                
            }
        }, 10 * 60 * 1000);
    }

    getAdminState(userId) {
        const state = this.#adminPanelStates.get(userId);
        if (state) logger.debug(`Admin state was gotten for user ${userId}, state: ${state}`); //? Logging getting adminState
        return state
    }

    clearAdminState(userId) {
        const state = this.#adminPanelStates.get(userId);
        if (state) logger.debug(`Admin state cleared for user ${userId}, state: ${state}`); //? Logging deleting adminState
        this.#adminPanelStates.delete(userId);
    }
   
    // ---------------- USER ROOM STATES ---------------- //
    setUserRoomState(userId, roomId) {
        this.#userRoomStates.set(userId, roomId);
        logger.debug(`User room state set for user ${userId} and room ${roomId}`); //? Logging setting userRoomState 
    }

    getUserRoomState(userId) { 
        const roomId = this.#userRoomStates.get(userId);
        if (roomId) logger.debug(`User room state was gotten for user ${userId} and room ${roomId}`); //? Logging getting userRoomState 
        return roomId
    }

    clearUserRoomState(userId) {
        const roomId = this.#userRoomStates.get(userId);
        if (roomId) logger.debug(`User room state cleared for user ${userId} and room ${roomId}`); //? Logging deleting userRoomState
        this.#userRoomStates.delete(userId);
    }

    // ---------------- ROOM SETTINGS STATES ---------------- //
    setRoomSettingsState(userId, state) { 
        this.#roomSettingsStates.set(userId, state);
        logger.debug(`Room settings state set for user ${userId}, state ${state}`); //? Logging getting roomSettingsState

        setTimeout(() => {
            if (this.#roomSettingsStates.get(userId) === state) {
                logger.debug(`Room settings state was autocleared (10 minutes left) for user ${userId}, state ${state}`); //? Logging autodeleting roomSettingsState
            }
        }, 10 * 60 * 1000);
    }

    getRoomSettingsState(userId) {
        const state = this.#roomSettingsStates.get(userId);
        if (state) logger.debug(`Room settings state was gotten for user ${userId}, state ${state}`); //? Logging getting roomSettingsState 
        return state
    }

    clearRoomSettingsState(userId) {
        const state = this.#roomSettingsStates.get(userId);
        if (state) logger.debug(`Room settings state cleared for user ${userId}, state ${state}`); //? Logging deleting roomSettingsState
        this.#roomSettingsStates.delete(userId)
    }
}

module.exports = {
    GlobalStates
};