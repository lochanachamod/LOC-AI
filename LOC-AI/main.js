const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false, // Removes default chrome
        transparent: true, // Allows rounded corners
        backgroundColor: '#00000000',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false // Required for your file system logic
        },
        icon: path.join(__dirname, 'icon.png') // ESSENTIAL FOR THE EXE
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

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});