const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs').promises;
require('@electron/remote/main').initialize();

const { setupAllHandlers } = require('./ipc');
const { closePython, closeTCPClient } = require('./ipc/pythonHandlers');

let win;
let store;

const userDataPath = app.getPath('userData');
const metaFilePath = path.join(userDataPath, 'meta.json');
const dataFilePath = path.join(userDataPath, 'maps.json');
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
    try{
        await fs.stat(dataFilePath)

        let response = await fs.readFile(dataFilePath, 'utf8');
        mapPairs = JSON.parse(response);
        
    }catch (error){

    }
    let ogResponse = await fs.readFile(path.join(enginePath, '_internal', 'maps.json'));
    let originalMaps = JSON.parse(ogResponse);
    
    Object.keys(originalMaps).forEach(key => {
        mapPairs[key] = originalMaps[key];
    });
    
    store.set("maps", mapPairs)
    
  }

async function initMetadata(){
    let metadata = {
        "numMatches":0,
        "pythonpath":""
    }
    try{
        await fs.stat(metaFilePath)
        let response = await fs.readFile(metaFilePath, 'utf8');
        metadata = JSON.parse(response);
    }catch (error){
        
    }
    
    store.set("pythonpath", metadata["pythonpath"])
    store.set("numMatches", metadata["numMatches"]);
    store.set("matchDir", matchPath);

    try{
        await fs.access(matchPath);
    } catch{
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

  win.loadFile('index.html');
}

app.on('ready', async () => {
  // Initialize store
  const Store = (await import('electron-store')).default;
  store = new Store();
  
  await initMaps(dataFilePath, enginePath, store);
  await initMetadata(metaFilePath, store);
  
  // Setup all IPC handlers
  setupAllHandlers(store, enginePath, matchPath, dataFilePath);
  
  createWindow();
});

app.on('before-quit', async () => {
  let num = 0;
  let maps = {};
  let pythonpath = "";
  
  if (store) {
    num = store.get("numMatches") || 0;
    maps = store.get("maps") || {};
    pythonpath = store.get("pythonpath") || "";
  }

  // Cleanup Python process
  closeTCPClient();
  closePython();
  

  console.log("Writing data files");
  await fs.writeFile(dataFilePath, JSON.stringify(maps, null, 2));
  await fs.writeFile(metaFilePath, JSON.stringify({
    numMatches: num,
    pythonpath: pythonpath
  }, null, 2));
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