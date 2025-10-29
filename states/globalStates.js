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
    adminPanelStates[userId] = {
        state: state,
        data: data,
        timestamp: Date.now()
    };
    
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
    delete adminPanelStates[userId];
}

//TODO ???????????
function isUserInAdminState(userId, state) {
    const userState = getAdminState(userId);
    return userState && userState.state === state;
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
    isUserInAdminState
};