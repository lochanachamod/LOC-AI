// Storage is now managed securely via the preload API

async function loadHistory() {
    return await window.api.loadHistory();
}

async function saveChat(sessionId, title, messages) {
    let history = await window.api.loadHistory();
    const existingIndex = history.findIndex(h => h.id === sessionId);
    const sessionData = { id: sessionId, title: title || 'New Session', timestamp: Date.now(), messages: messages };

    if (existingIndex >= 0) history[existingIndex] = sessionData;
    else history.unshift(sessionData);

    await window.api.saveHistory(history);
}

async function deleteChat(sessionId) {
    let history = await window.api.loadHistory();
    history = history.filter(h => h.id !== sessionId); 
    await window.api.saveHistory(history);
}

// Since we are no longer using CommonJS in the browser (due to nodeIntegration: false), 
// we expose these globally or include them directly.
window.storage = { loadHistory, saveChat, deleteChat };