/**
 * Storage Utility
 * Wrapper for localStorage
 */

const KEYS = {
    USERS: 'mahjong_users',
    SESSIONS: 'mahjong_sessions',
    SETTINGS: 'mahjong_settings'
};

// --- Users ---

export function getUsers() {
    const data = localStorage.getItem(KEYS.USERS);
    return data ? JSON.parse(data) : [];
}

export function addUser(name) {
    const users = getUsers();
    if (users.includes(name)) {
        return false; // Duplicate
    }
    users.push(name);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    return true;
}

export function removeUser(name) {
    let users = getUsers();
    users = users.filter(u => u !== name);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
}

// --- Sessions ---

export function getSessions() {
    const data = localStorage.getItem(KEYS.SESSIONS);
    return data ? JSON.parse(data) : [];
}

export function createSession(date, playerNames, rules = null) {
    const sessions = getSessions();
    // Use provided rules or fallback to current global settings
    const sessionRules = rules || getSettings();

    const newSession = {
        id: Date.now(),
        date: date, // YYYY-MM-DD
        players: playerNames, // Array of 4 names
        rules: sessionRules,
        games: []
    };
    sessions.unshift(newSession);
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
    return newSession;
}

export function getSession(sessionId) {
    const sessions = getSessions();
    return sessions.find(s => s.id === Number(sessionId));
}

export function addGameToSession(sessionId, gameData) {
    const sessions = getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === Number(sessionId));

    if (sessionIndex !== -1) {
        sessions[sessionIndex].games.push(gameData);
        localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
        return true;
    }
    return false;
}

export function updateSession(sessionId, updates) {
    const sessions = getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === Number(sessionId));

    if (sessionIndex !== -1) {
        sessions[sessionIndex] = { ...sessions[sessionIndex], ...updates };
        localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
        return true;
    }
    return false;
}

export function removeSession(sessionId) {
    let sessions = getSessions();
    sessions = sessions.filter(s => s.id !== Number(sessionId));
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
}

export function removeGameFromSession(sessionId, gameId) {
    const sessions = getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === Number(sessionId));

    if (sessionIndex !== -1) {
        sessions[sessionIndex].games = sessions[sessionIndex].games.filter(g => g.id !== Number(gameId));
        localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
        return true;
    }
    return false;
}

export function updateGameInSession(sessionId, gameId, updatedGameData) {
    const sessions = getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === Number(sessionId));

    if (sessionIndex !== -1) {
        const gameIndex = sessions[sessionIndex].games.findIndex(g => g.id === Number(gameId));
        if (gameIndex !== -1) {
            sessions[sessionIndex].games[gameIndex] = updatedGameData;
            localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
            return true;
        }
    }
    return false;
}

export function clearAllData() {
    localStorage.removeItem(KEYS.USERS);
    localStorage.removeItem(KEYS.SESSIONS);
    localStorage.removeItem(KEYS.SETTINGS);
}

// --- Settings ---

const DEFAULT_SETTINGS = {
    startScore: 25000,
    returnScore: 30000,
    uma: [30, 10, -10, -30],
    tieBreaker: 'priority' // 'priority' or 'split'
};

export function getSettings() {
    const data = localStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
}

export function saveSettings(settings) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}
