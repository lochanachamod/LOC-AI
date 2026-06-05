const { contextBridge, ipcRenderer, webUtils } = require('electron');
const { marked } = require('marked');
const hljs = require('highlight.js');

marked.setOptions({ breaks: true, gfm: true });

const renderer = new marked.Renderer();
renderer.code = function(token) {
    let content = token.text || "";
    let lg = token.lang || 'plaintext';
    const validLang = hljs.getLanguage(lg) ? lg : 'plaintext';
    let highlighted;
    try { highlighted = hljs.highlight(content, { language: validLang }).value; } catch (e) { highlighted = content; }
    return `<div class="code-wrapper"><div class="code-header"><span class="lang-tag">${validLang.toUpperCase()}</span><button class="copy-btn" onclick="copyCode(this)">COPY</button></div><pre><code class="hljs ${validLang}">${highlighted}</code></pre><textarea class="raw-code" style="display:none;">${content}</textarea></div>`;
};
marked.use({ renderer });

contextBridge.exposeInMainWorld('api', {
    minimize: () => ipcRenderer.send('app-minimize'),
    maximize: () => ipcRenderer.send('app-maximize'),
    close: () => ipcRenderer.send('app-close'),
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    loadHistory: () => ipcRenderer.invoke('load-history'),
    saveHistory: (history) => ipcRenderer.invoke('save-history', history),
    getPathForFile: (file) => webUtils.getPathForFile(file),
    clipboardWrite: (text) => navigator.clipboard.writeText(text),
    parseMarkdown: (text) => marked.parse(text)
});
