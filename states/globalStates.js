const logger = require('../utils/logger');

// Gaming states
const players = [];
let playersIDCounter = 0;
let currentGame = "Не выбрано!";
let isGamingSession = false;

// Admin-panel states
const adminPanelStates = {}; 
// Формат: { userId: { state: 'main_menu' | 'awaiting_admin_id' | 'confirming_admin_add', data: {} } }

// Constants
const ADMIN_STATES = {
    MAIN_MENU: 'main_menu',
    AWAITING_ADMIN_ID: 'awaiting_admin_id',
    AWAITING_SUPERADMIN_ID: 'awaiting_superadmin_id'
};

function setAdminState(userId, state, data = {}) {
    const previousState = adminPanelStates[userId]?.state; //? For logging
    adminPanelStates[userId] = {
        state: state,
        data: data,
        timestamp: Date.now()
    };
    
    console.log(data);
    
    //? Logging
    if (previousState) {
        logger.debug(`Admin state changed for user ${userId}, state: ${previousState} → ${state}. Data :${JSON.stringify(data)}`);        
    } else {
        logger.debug(`Admin state set for user ${userId}, state: ${state}. Data :${JSON.stringify(data)}`);
    }
    
    // Autoclearing in 10 mins
    setTimeout(() => {
        if (adminPanelStates[userId]?.state === state) {
            delete adminPanelStates[userId];
        }
    }, 10 * 60 * 1000);
}

function getAdminState(userId) {
    return adminPanelStates[userId];
}

function clearAdminState(userId) {
    //? Logging
    const previousState = adminPanelStates[userId]?.state;
    if (previousState) {
        logger.debug(`Manually clearing admin state for user ${userId}. Cleared state - ${previousState}`);
    }

    delete adminPanelStates[userId];
}

module.exports = {
    // Gaming states
    players,
    playersIDCounter,
    currentGame,
    isGamingSession,
    
    // Admin-panel states
    adminPanelStates,
    ADMIN_STATES,
    setAdminState,
    getAdminState,
    clearAdminState,
};