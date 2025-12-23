const { ipcMain } = require('electron');
const { ipcMain, dialog } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const { ipcMain } = require('electron');
const fs = require('fs').promises;
const path = require('path');

function setupElectronStoreHandlers(store) {
  ipcMain.handle('store-set', async (event, key, value) => {
    store.set(key, value);
  });

  ipcMain.handle('store-get', async (event, key) => {
    return store.get(key);
  });
}


function setupFileHandlers(dataFilePath, enginePath) {
  
  ipcMain.handle('read-file', async (event, filePath) => {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return data;
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  });

  ipcMain.handle('read-map', async (event) => {
    try {
      console.log(dataFilePath);
      const data = await fs.readFile(dataFilePath, 'utf8');
      console.log(data);
      return data;
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  });

  ipcMain.handle('write-map', async (event, data) => {
    try {
      await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));
      return { success: true };
    } catch (error) {
      console.error('Error writing to JSON file:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('dialog:selectFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    return result.filePaths[0];
  });

    ipcMain.handle('delete-map', async (event, map) => {
    const maps = store.get("maps");
    delete maps[map];
    store.set("maps", maps);
  });

  ipcMain.handle('delete-maps', async (event) => {
    const ogResponse = await fs.readFile(path.join(enginePath, '_internal', 'maps.json'));
    const originalMaps = JSON.parse(ogResponse);
    
    const mapPairs = {};
    Object.keys(originalMaps).forEach(key => {
      mapPairs[key] = originalMaps[key];
    });
    
    store.set("maps", mapPairs);
  });
}


function setupMatchHandlers(matchPath) {
  
  ipcMain.handle('get-matches', async (event) => {
    try {
      const files = await fs.readdir(matchPath);
      return files;
    } catch (err) {
      console.error('Error reading matches:', err);
      return [];
    }
  });

  ipcMain.handle('read-match', async (event, match_json) => {
    try {
      const data = await fs.readFile(path.join(matchPath, match_json), 'utf8');
      console.log(data);
      return data;
    } catch (err) {
      console.error('Error reading match:', err);
      throw err;
    }
  });

  ipcMain.handle('load-match', async (event, sourcefile, num) => {
    try {
      await fs.copyFile(sourcefile, path.join(matchPath, `${num}.json`));
    } catch (error) {
      throw new Error(`Failed to load match: ${error.message}`);
    }
  });

  ipcMain.handle('copy-match', async (event, sourcefile, num) => {
    try {
      await fs.copyFile(sourcefile, path.join(matchPath, `${num}.json`));
    } catch (error) {
      throw new Error(`Failed to copy match: ${error.message}`);
    }
  });

  ipcMain.handle('delete-match', async (event, file) => {
    console.log("Deleting match:", file);
    const filePath = path.join(matchPath, file);
    await fs.unlink(filePath);
  });

  ipcMain.handle('delete-matches', async (event) => {
    try {
      const files = await fs.readdir(matchPath);
      for (const file of files) {
        const filePath = path.join(matchPath, file);
        await fs.unlink(filePath);
      }
    } catch (err) {
      console.error('Error deleting matches:', err);
    }
  });
}

module.exports = { setupElectronStoreHandlers, setupFileHandlers, setupMatchHandlers};