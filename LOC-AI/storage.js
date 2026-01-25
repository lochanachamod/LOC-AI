const fs = require('fs');
const path = require('path');
const os = require('os');

const DATA_DIR = path.join(os.homedir(), '.loc-ai');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

function loadHistory() {
    if (!fs.existsSync(HISTORY_FILE)) return [];
    try {
        const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (e) { return []; }
}

function saveChat(sessionId, title, messages) {
    let history = loadHistory();
    const existingIndex = history.findIndex(h => h.id === sessionId);
    const sessionData = { id: sessionId, title: title || 'New Session', timestamp: Date.now(), messages: messages };

    if (existingIndex >= 0) history[existingIndex] = sessionData;
    else history.unshift(sessionData);

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

// NEW: Delete Function
function deleteChat(sessionId) {
    let history = loadHistory();
    history = history.filter(h => h.id !== sessionId); // Remove the specific chat
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

module.exports = { loadHistory, saveChat, deleteChat };