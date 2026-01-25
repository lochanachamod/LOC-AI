const { ipcRenderer, clipboard, webUtils } = require('electron');
const { marked } = require('marked');
const hljs = require('highlight.js');
const fs = require('fs');
const { loadHistory, saveChat, deleteChat } = require('./storage');

// --- CONFIG ---
marked.setOptions({ breaks: true, gfm: true });

// --- VARIABLES ---
let currentSessionId = Date.now().toString();
let currentMessages = [];
let APP_MODE = 'OFFLINE';
let ONLINE_API_KEY = localStorage.getItem('loc_ai_api_key') || '';
let SYSTEM_PROMPT = localStorage.getItem('loc_ai_system_prompt') || '';
let ATTACHED_FILE_CONTENT = null;
let ATTACHED_FILE_NAME = null;

// --- INIT ---
window.addEventListener('DOMContentLoaded', () => {
    // Intro Animation
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        splash.style.opacity = '0';
        setTimeout(() => splash.style.display = 'none', 500);
    }, 2000);

    refreshSidebar();
    updateModeUI();
    document.getElementById('api-key-input').value = ONLINE_API_KEY;
    document.getElementById('system-prompt-input').value = SYSTEM_PROMPT;
    
    addMessage('LOC-AI CORE', 'System Initialized. Ready.', 'ai-message', false);
    
    // SAFETY: Ensure input is unlocked on start
    forceInputUnlock();
});

// --- HELPER: CLEAN AI TEXT ---
function cleanAIResponse(text) {
    return text.replace(/(?<!\n)#/g, "\n\n#")
               .replace(/(?<!\n)- /g, "\n- ")
               .replace(/(?<!\n)```/g, "\n```")
               .replace(/# # #/g, "\n\n---");
}

// --- HELPER: FORCE UNLOCK INPUT (Fixes Freezing) ---
function forceInputUnlock() {
    const input = document.getElementById('user-input');
    const btn = document.getElementById('send-btn');
    input.disabled = false;
    input.placeholder = "Awaiting Command...";
    input.focus();
    btn.disabled = false;
    btn.style.opacity = "1";
    btn.style.cursor = "pointer";
    
    // Remove any stuck thinking indicators
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
        saveChat(currentSessionId, text.substring(0, 20) + "...", currentMessages);
        refreshSidebar();
    }

    const thinkingId = showThinkingIndicator(); // Locks Input

    try {
        const contextHistory = currentMessages.slice(-6).map(m => `${m.sender}: ${m.text}`).join('\n');
        let systemInstruction = SYSTEM_PROMPT ? `[SYSTEM INSTRUCTION: ${SYSTEM_PROMPT}]\n\n` : "";
        
        // --- PROMPT ENGINEERING FIX (Fixes "Cannot read file") ---
        // We explicitly tell the AI "Here is the content" so it doesn't think it needs to read a disk file.
        let prompt = "";
        
        if (ATTACHED_FILE_CONTENT) {
            prompt = `${systemInstruction}
=== BEGIN FILE CONTENT: ${ATTACHED_FILE_NAME} ===
${ATTACHED_FILE_CONTENT}
=== END FILE CONTENT ===

[HISTORY]
${contextHistory}

[USER QUESTION]: ${text}
(Please answer based on the file content provided above)`;
            
            // Clear the file from memory and UI
            document.getElementById('remove-file').click();
        } else {
            prompt = `${systemInstruction}[HISTORY]\n${contextHistory}\n\n[USER]: ${text}`;
        }

        let rawResponse;
        if (APP_MODE === 'ONLINE') {
            if (!ONLINE_API_KEY) throw new Error("NO_API_KEY");
            rawResponse = await queryGroqAI(prompt);
        } else {
            rawResponse = await queryLocalAI(prompt);
        }

        const polishedResponse = cleanAIResponse(rawResponse);
        
        // Remove specific thinking ID
        const el = document.getElementById(thinkingId);
        if(el) el.remove();
        
        // Ensure unlocked
        forceInputUnlock(); 
        
        addMessage('LOC-AI CORE', polishedResponse, 'ai-message');
        saveChat(currentSessionId, currentMessages[0].text.substring(0, 25), currentMessages);

    } catch (error) {
        const el = document.getElementById(thinkingId);
        if(el) el.remove();
        forceInputUnlock(); // Ensure unlocked on error

        if (error.message === "NO_API_KEY") {
            addMessage('SYSTEM', 'ACCESS DENIED: Set API Key in Settings.', 'ai-message');
            document.getElementById('settings-modal').style.display = 'flex';
        } else {
            addMessage('SYSTEM ERROR', error.message, 'ai-message');
        }
    }
}

// --- API ---
async function queryLocalAI(prompt) {
    const res = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'qwen2.5-coder:1.5b', prompt: prompt, stream: false })
    });
    if (!res.ok) throw new Error("Ollama Connection Failed. Is it running?");
    const data = await res.json();
    return data.response;
}

async function queryGroqAI(prompt) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ONLINE_API_KEY}` },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }] })
    });
    const data = await res.json();
    if(data.error) throw new Error(data.error.message);
    return data.choices[0].message.content;
}

// --- RENDERERS ---
function addMessage(sender, text, className, save = true) {
    if (save) currentMessages.push({ sender, text, className });
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', className);
    let html = text;
    if (className === 'ai-message') { try { html = marked.parse(text); } catch (e) { html = text; } }
    msgDiv.innerHTML = `<span class="msg-sender">${sender}</span><div class="msg-content">${html}</div>`;
    const display = document.getElementById('chat-display');
    display.appendChild(msgDiv);
    display.scrollTop = display.scrollHeight;
}

const renderer = new marked.Renderer();
renderer.code = function(token, lang) {
    let content = (typeof token === 'object' && token.text) ? token.text : String(token || "");
    let lg = (typeof token === 'object' && token.lang) ? token.lang : lang;
    const validLang = hljs.getLanguage(lg || 'plaintext') ? lg : 'plaintext';
    let highlighted;
    try { highlighted = hljs.highlight(content, { language: validLang }).value; } catch (e) { highlighted = content; }
    return `<div class="code-wrapper"><div class="code-header"><span class="lang-tag">${validLang.toUpperCase()}</span><button class="copy-btn" onclick="copyCode(this)">COPY</button></div><pre><code class="hljs ${validLang}">${highlighted}</code></pre><textarea class="raw-code" style="display:none;">${content}</textarea></div>`;
};
marked.use({ renderer });

// --- UI HELPERS ---
function showThinkingIndicator() {
    const id = 'th-' + Date.now();
    const div = document.createElement('div'); div.id = id; div.classList.add('message', 'ai-message', 'thinking-pulse');
    div.innerHTML = `<span class="msg-sender">LOC-AI</span><div class="msg-content">NEURAL PROCESSING...</div>`;
    document.getElementById('chat-display').appendChild(div);
    
    // Lock Input
    const input = document.getElementById('user-input');
    const btn = document.getElementById('send-btn');
    input.disabled = true; input.placeholder = "Processing..."; btn.disabled = true;
    return id;
}

window.copyCode = function(btn) { clipboard.writeText(btn.closest('.code-wrapper').querySelector('.raw-code').value); btn.innerText = 'COPIED!'; setTimeout(() => btn.innerText = 'COPY', 2000); };

// --- SIDEBAR ---
function refreshSidebar() {
    const history = loadHistory();
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

window.deleteSession = function(id, event) {
    event.stopPropagation();
    if(confirm('Delete chat?')) { 
        deleteChat(id); 
        refreshSidebar(); 
        if(id === currentSessionId) document.getElementById('new-chat-btn').click(); 
    }
};

function loadSession(session) {
    // Safety Unlock when switching chats
    forceInputUnlock();
    
    currentSessionId = session.id; currentMessages = session.messages;
    const display = document.getElementById('chat-display');
    display.innerHTML = '';
    currentMessages.forEach(msg => {
        const msgDiv = document.createElement('div'); msgDiv.classList.add('message', msg.className);
        let html = msg.text; if(msg.className === 'ai-message') try { html = marked.parse(msg.text); } catch(e){}
        msgDiv.innerHTML = `<span class="msg-sender">${msg.sender}</span><div class="msg-content">${html}</div>`;
        display.appendChild(msgDiv);
    });
    display.scrollTop = display.scrollHeight;
    refreshSidebar();
}

// --- CONTROLS ---
const btnGod = document.querySelector('.mode-btn:nth-child(1)');
const btnBunker = document.querySelector('.mode-btn:nth-child(2)');
const btnSettings = document.getElementById('btn-settings');
const modal = document.getElementById('settings-modal');

function updateModeUI() {
    // Safety Unlock when switching modes
    forceInputUnlock();
    
    const input = document.getElementById('user-input');
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

// File Inputs
const attachBtn = document.getElementById('attach-btn');
const fileInput = document.getElementById('file-input');
attachBtn.onclick = () => fileInput.click();
fileInput.onchange = (e) => { const f = e.target.files[0]; if(f) handleFile(webUtils.getPathForFile(f), f.name); };
document.addEventListener('drop', (e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f) handleFile(webUtils.getPathForFile(f), f.name); });
document.addEventListener('dragover', e => e.preventDefault());
function handleFile(path, name) { try { ATTACHED_FILE_CONTENT = fs.readFileSync(path, 'utf-8'); ATTACHED_FILE_NAME = name; document.getElementById('file-preview').style.display = 'inline-flex'; document.getElementById('file-name').innerText = name; } catch(e) { alert("Error reading file"); } }
document.getElementById('remove-file').onclick = () => { ATTACHED_FILE_CONTENT = null; document.getElementById('file-preview').style.display = 'none'; fileInput.value = ''; };

document.getElementById('new-chat-btn').onclick = () => { 
    forceInputUnlock(); // Safety Unlock on new chat
    currentSessionId = Date.now().toString(); 
    currentMessages = []; 
    document.getElementById('chat-display').innerHTML = ''; 
    addMessage('LOC-AI CORE', 'System Ready.', 'ai-message', false); 
    refreshSidebar(); 
};

document.getElementById('send-btn').onclick = sendMessage;
document.getElementById('user-input').onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
document.getElementById('btn-min').onclick = () => ipcRenderer.send('app-minimize');
document.getElementById('btn-max').onclick = () => ipcRenderer.send('app-maximize');
document.getElementById('btn-close').onclick = () => ipcRenderer.send('app-close');