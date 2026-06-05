// --- VARIABLES ---
let currentSessionId = Date.now().toString();
let currentMessages = [];
let APP_MODE = 'OFFLINE';
let ONLINE_API_KEY = localStorage.getItem('loc_ai_api_key') || '';
let SYSTEM_PROMPT = localStorage.getItem('loc_ai_system_prompt') || '';
let ATTACHED_FILE_CONTENT = null;
let ATTACHED_FILE_NAME = null;

// --- INIT ---
window.addEventListener('DOMContentLoaded', async () => {
    // Intro Animation
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        splash.style.opacity = '0';
        setTimeout(() => splash.style.display = 'none', 500);
    }, 2000);

    await refreshSidebar();
    updateModeUI();
    document.getElementById('api-key-input').value = ONLINE_API_KEY;
    document.getElementById('system-prompt-input').value = SYSTEM_PROMPT;
    
    addMessage('LOC-AI CORE', 'System Initialized. Ready.', 'ai-message', false);
    forceInputUnlock();
});

// --- HELPER: CLEAN AI TEXT ---
function cleanAIResponse(text) {
    return text.replace(/(?<!\n)#/g, "\n\n#")
               .replace(/(?<!\n)- /g, "\n- ")
               .replace(/(?<!\n)```/g, "\n```")
               .replace(/# # #/g, "\n\n---");
}

// --- HELPER: FORCE UNLOCK INPUT ---
function forceInputUnlock() {
    const input = document.getElementById('user-input');
    const btn = document.getElementById('send-btn');
    input.disabled = false;
    input.placeholder = "Awaiting Command...";
    input.focus();
    btn.disabled = false;
    btn.style.opacity = "1";
    btn.style.cursor = "pointer";
    
    const existingThinker = document.querySelector('.thinking-pulse');
    if(existingThinker) existingThinker.remove();
}

// --- CORE LOGIC ---
async function sendMessage() {
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (text === "" && !ATTACHED_FILE_CONTENT) return;

    let displayHtml = text.replace(/\n/g, '<br>');
    if (ATTACHED_FILE_CONTENT) {
        displayHtml = `<span style="color:#00f3ff">[FILE: ${ATTACHED_FILE_NAME}]</span><br>${displayHtml}`;
    }
    
    addMessage('USER', displayHtml, 'user-message');
    input.value = '';

    if (currentMessages.length === 1) {
        await window.storage.saveChat(currentSessionId, text.substring(0, 20) + "...", currentMessages);
        await refreshSidebar();
    }

    // Prepare Streaming Bubble
    const streamId = 'msg-' + Date.now();
    addStreamBubble('LOC-AI CORE', streamId);
    lockInputForStream();

    try {
        const contextHistory = currentMessages.slice(-6).map(m => `${m.sender}: ${m.text}`).join('\n');
        let systemInstruction = SYSTEM_PROMPT ? `[SYSTEM INSTRUCTION: ${SYSTEM_PROMPT}]\n\n` : "";
        
        let prompt = "";
        if (ATTACHED_FILE_CONTENT) {
            prompt = `${systemInstruction}=== BEGIN FILE CONTENT: ${ATTACHED_FILE_NAME} ===\n${ATTACHED_FILE_CONTENT}\n=== END FILE CONTENT ===\n\n[HISTORY]\n${contextHistory}\n\n[USER QUESTION]: ${text}`;
            document.getElementById('remove-file').click();
        } else {
            prompt = `${systemInstruction}[HISTORY]\n${contextHistory}\n\n[USER]: ${text}`;
        }

        let fullResponse = "";
        
        if (APP_MODE === 'ONLINE') {
            if (!ONLINE_API_KEY) throw new Error("NO_API_KEY");
            fullResponse = await streamGroqAI(prompt, streamId);
        } else {
            fullResponse = await streamLocalAI(prompt, streamId);
        }

        const polishedResponse = cleanAIResponse(fullResponse);
        updateStreamBubble(streamId, polishedResponse);
        
        // Save to memory
        currentMessages.push({ sender: 'LOC-AI CORE', text: polishedResponse, className: 'ai-message' });
        await window.storage.saveChat(currentSessionId, currentMessages[0].text.substring(0, 25), currentMessages);

    } catch (error) {
        const el = document.getElementById(streamId);
        if(el) el.remove();
        
        if (error.message === "NO_API_KEY") {
            addMessage('SYSTEM', 'ACCESS DENIED: Set API Key in Settings.', 'ai-message');
            document.getElementById('settings-modal').style.display = 'flex';
        } else {
            addMessage('SYSTEM ERROR', error.message, 'ai-message');
        }
    } finally {
        forceInputUnlock();
    }
}

// --- STREAMING API ---
async function streamLocalAI(prompt, elementId) {
    const res = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'qwen2.5-coder:1.5b', prompt: prompt, stream: true })
    });
    if (!res.ok) throw new Error("Ollama Connection Failed. Is it running?");
    
    return await readStream(res, elementId, (chunk) => {
        try {
            const parsed = JSON.parse(chunk);
            return parsed.response || "";
        } catch(e) { return ""; }
    });
}

async function streamGroqAI(prompt, elementId) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ONLINE_API_KEY}` },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], stream: true })
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "API Error");
    }

    return await readStream(res, elementId, (chunk) => {
        if(chunk.trim() === "[DONE]") return "";
        try {
            const parsed = JSON.parse(chunk);
            return parsed.choices[0]?.delta?.content || "";
        } catch(e) { return ""; }
    }, "data: ");
}

async function readStream(response, elementId, extractDelta, prefixToRemove = null) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullText = "";
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n');
        
        for (let line of lines) {
            line = line.trim();
            if(!line) continue;
            if(prefixToRemove && line.startsWith(prefixToRemove)) {
                line = line.substring(prefixToRemove.length);
            }
            const delta = extractDelta(line);
            fullText += delta;
            updateStreamBubble(elementId, fullText);
        }
    }
    return fullText;
}

// --- RENDERERS ---
function lockInputForStream() {
    const input = document.getElementById('user-input');
    const btn = document.getElementById('send-btn');
    input.disabled = true; input.placeholder = "Processing Stream..."; btn.disabled = true;
}

function addStreamBubble(sender, id) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'ai-message');
    msgDiv.id = id;
    msgDiv.innerHTML = `<span class="msg-sender">${sender}</span><div class="msg-content">...</div>`;
    const display = document.getElementById('chat-display');
    display.appendChild(msgDiv);
    display.scrollTop = display.scrollHeight;
}

async function updateStreamBubble(id, text) {
    const el = document.getElementById(id);
    if(el) {
        let html = await window.api.parseMarkdown(text);
        el.querySelector('.msg-content').innerHTML = html;
        const display = document.getElementById('chat-display');
        display.scrollTop = display.scrollHeight;
    }
}

async function addMessage(sender, text, className, save = true) {
    if (save) currentMessages.push({ sender, text, className });
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', className);
    let html = text;
    if (className === 'ai-message') { try { html = await window.api.parseMarkdown(text); } catch (e) { html = text; } }
    msgDiv.innerHTML = `<span class="msg-sender">${sender}</span><div class="msg-content">${html}</div>`;
    const display = document.getElementById('chat-display');
    display.appendChild(msgDiv);
    display.scrollTop = display.scrollHeight;
}

window.copyCode = function(btn) { 
    window.api.clipboardWrite(btn.closest('.code-wrapper').querySelector('.raw-code').value); 
    btn.innerText = 'COPIED!'; setTimeout(() => btn.innerText = 'COPY', 2000); 
};

// --- SIDEBAR ---
async function refreshSidebar() {
    const history = await window.storage.loadHistory();
    const list = document.querySelector('.history-list');
    list.innerHTML = '';
    history.forEach(session => {
        const div = document.createElement('div');
        div.classList.add('history-item');
        if (session.id === currentSessionId) div.classList.add('active');
        div.innerHTML = `<span>${session.title}</span><button class="delete-chat" onclick="deleteSession('${session.id}', event)">🗑️</button>`;
        div.onclick = () => loadSession(session);
        list.appendChild(div);
    });
}

window.deleteSession = async function(id, event) {
    event.stopPropagation();
    if(confirm('Delete chat?')) { 
        await window.storage.deleteChat(id); 
        await refreshSidebar(); 
        if(id === currentSessionId) document.getElementById('new-chat-btn').click(); 
    }
};

async function loadSession(session) {
    forceInputUnlock();
    currentSessionId = session.id; currentMessages = session.messages;
    const display = document.getElementById('chat-display');
    display.innerHTML = '';
    for(const msg of currentMessages) {
        await addMessage(msg.sender, msg.text, msg.className, false);
    }
}

// --- CONTROLS ---
const btnGod = document.querySelector('.mode-btn:nth-child(1)');
const btnBunker = document.querySelector('.mode-btn:nth-child(2)');
const btnSettings = document.getElementById('btn-settings');
const modal = document.getElementById('settings-modal');

function updateModeUI() {
    forceInputUnlock();
    if (APP_MODE === 'ONLINE') { btnGod.classList.add('active'); btnBunker.classList.remove('active'); } 
    else { btnGod.classList.remove('active'); btnBunker.classList.add('active'); }
}

btnGod.onclick = () => { APP_MODE = 'ONLINE'; updateModeUI(); if(!ONLINE_API_KEY) modal.style.display = 'flex'; };
btnBunker.onclick = () => { APP_MODE = 'OFFLINE'; updateModeUI(); };
btnSettings.onclick = () => { modal.style.display = 'flex'; document.getElementById('api-key-input').value = ONLINE_API_KEY; };
document.getElementById('close-settings').onclick = () => modal.style.display = 'none';
document.getElementById('save-settings-btn').onclick = () => { 
    ONLINE_API_KEY = document.getElementById('api-key-input').value.trim(); 
    SYSTEM_PROMPT = document.getElementById('system-prompt-input').value.trim();
    localStorage.setItem('loc_ai_api_key', ONLINE_API_KEY); 
    localStorage.setItem('loc_ai_system_prompt', SYSTEM_PROMPT);
    modal.style.display = 'none'; 
};

// --- FILE INPUTS & DRAG OVERLAY ---
const attachBtn = document.getElementById('attach-btn');
const fileInput = document.getElementById('file-input');
attachBtn.onclick = () => fileInput.click();
fileInput.onchange = (e) => { const f = e.target.files[0]; if(f) handleFile(f); };

const dragOverlay = document.createElement('div');
dragOverlay.classList.add('drag-overlay');
dragOverlay.innerHTML = `<h2>DROP FILE TO ANALYZE</h2>`;
document.body.appendChild(dragOverlay);

document.addEventListener('dragover', e => { e.preventDefault(); dragOverlay.style.opacity = '1'; dragOverlay.style.pointerEvents = 'all'; });
document.addEventListener('dragleave', e => { if (e.clientX === 0 && e.clientY === 0) { dragOverlay.style.opacity = '0'; dragOverlay.style.pointerEvents = 'none'; }});
document.addEventListener('drop', (e) => { 
    e.preventDefault(); 
    dragOverlay.style.opacity = '0'; dragOverlay.style.pointerEvents = 'none'; 
    const f = e.dataTransfer.files[0]; if(f) handleFile(f); 
});

async function handleFile(f) { 
    try { 
        const path = window.api.getPathForFile(f);
        ATTACHED_FILE_CONTENT = await window.api.readFile(path); 
        ATTACHED_FILE_NAME = f.name; 
        document.getElementById('file-preview').style.display = 'inline-flex'; 
        document.getElementById('file-name').innerText = f.name; 
    } catch(e) { alert("Error reading file"); } 
}
document.getElementById('remove-file').onclick = () => { ATTACHED_FILE_CONTENT = null; document.getElementById('file-preview').style.display = 'none'; fileInput.value = ''; };

document.getElementById('new-chat-btn').onclick = () => { 
    forceInputUnlock(); 
    currentSessionId = Date.now().toString(); 
    currentMessages = []; 
    document.getElementById('chat-display').innerHTML = ''; 
    addMessage('LOC-AI CORE', 'System Ready.', 'ai-message', false); 
    refreshSidebar(); 
};

document.getElementById('send-btn').onclick = sendMessage;
document.getElementById('user-input').onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
document.getElementById('btn-min').onclick = () => window.api.minimize();
document.getElementById('btn-max').onclick = () => window.api.maximize();
document.getElementById('btn-close').onclick = () => window.api.close();