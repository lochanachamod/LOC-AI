const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false, // Removes default chrome
        transparent: true, // Allows rounded corners
        backgroundColor: '#00000000',
        webPreferences: {
            nodeIntegration: false, // SECURE: No Node in renderer
            contextIsolation: true, // SECURE: Isolated context
            sandbox: false, // SECURE: Allow preload script to use node modules
            preload: path.join(__dirname, 'preload.js') // SECURE: Bridge
        },
        icon: path.join(__dirname, 'icon.png')
    });

    win.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();
});

// Window Control Logic
ipcMain.on('app-minimize', () => { win.minimize(); });
ipcMain.on('app-maximize', () => { 
    if (win.isMaximized()) win.unmaximize(); 
    else win.maximize(); 
});
ipcMain.on('app-close', () => { win.close(); });

// Secure File System Access
ipcMain.handle('read-file', async (event, filePath) => {
    try {
        const ext = path.extname(filePath).toLowerCase();
        
        if (ext === '.pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse(dataBuffer);
            return data.text;
        } 
        else if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
            const result = await Tesseract.recognize(filePath, 'eng');
            return result.data.text;
        } 
        else {
            return fs.readFileSync(filePath, 'utf-8');
        }
    } catch (error) {
        throw error;
    }
});

// Secure Storage Access
const DATA_DIR = path.join(os.homedir(), '.loc-ai');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

ipcMain.handle('load-history', () => {
    if (!fs.existsSync(HISTORY_FILE)) return [];
    try {
        const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (e) { return []; }
});

ipcMain.handle('save-history', (event, history) => {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});