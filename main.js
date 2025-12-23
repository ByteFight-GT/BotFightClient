const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs').promises;
require('@electron/remote/main').initialize();

const { setupAllHandlers } = require('./ipc');
const { closePython, closeTCPClient } = require('./ipc/pythonHandlers');

let win;
let store;

const userDataPath = app.getPath('userData');
const matchPath = path.join(userDataPath, 'match_runs');

let enginePath;
if (app.isPackaged) {
    enginePath = path.join(process.resourcesPath, 'engine');
} else {
    enginePath = path.join(app.getAppPath(), 'engine');
}


async function initMaps() {
    // initialize maps
    let mapPairs = {}
    if(store.has('maps')){
        mapPairs = store.get('maps')
    }

    let ogResponse = await fs.readFile(path.join(enginePath, 'config', 'maps.json'));
    let originalMaps = JSON.parse(ogResponse);

    Object.keys(originalMaps).forEach(key => {
        mapPairs[key] = originalMaps[key];
    });

    store.set("maps", mapPairs)
}

async function initMetadata() {

    if(!store.has('numMatches')){
        store.set("numMatches", 0)
    }
    if(!store.has('pythonpath')){
        store.set("pythonpath", '')
    }
   
    store.set("matchDir", matchPath);

    try {
        await fs.access(matchPath);
    } catch {
        await fs.mkdir(matchPath, { recursive: true }, (err) => {
            if (err) {
                console.error('Error creating directory:', err);
            } else {
                console.log('Directory created successfully!');
            }
        })

    }
}

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    require('@electron/remote/main').enable(win.webContents)

    // In your main Electron process (main.js or main.ts)
    if (!app.isPackaged) {
        win.loadURL('http://localhost:3000')  // URL served by your dev server (like React's dev server)
    } else {
        console.log(`file://${path.join(__dirname, 'index.html')}`)
        win.loadURL(`file://${path.join(__dirname, 'index.html')}`);
    }

    if (!app.isPackaged) {
        win.webContents.openDevTools()
    }
}

app.on('ready', async () => {
    // Initialize store
    const Store = (await import('electron-store')).default;
    store = new Store();

    await initMaps();
    await initMetadata();

    // Setup all IPC handlers
    setupAllHandlers(store, enginePath, matchPath);

    createWindow();
});

app.on('before-quit', async (event) => {

    event.preventDefault(); // otherwise writing out will never occur

    console.log("Exiting python");
    // Cleanup Python process
    closeTCPClient();
    closePython();

    app.exit(0);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});