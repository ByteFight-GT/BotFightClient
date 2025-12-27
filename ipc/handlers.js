import { ipcMain, dialog } from 'electron';
import { promises as fs } from 'fs';
import { join } from 'path';

export function setupElectronStoreHandlers(store, enginePath) {
  ipcMain.handle('store-set', async (event, key, value) => {
    store.set(key, value);
  });

  ipcMain.handle('store-get', async (event, key) => {
    return store.get(key);
  });


  ipcMain.handle('delete-map', async (event, map) => {
    const maps = store.get("maps");
    delete maps[map];
    store.set("maps", maps);
  });

  ipcMain.handle('delete-maps', async (event) => {
    const ogResponse = await fs.readFile(join(enginePath, 'config', 'maps.json'));
    const originalMaps = JSON.parse(ogResponse);
    
    const mapPairs = {};
    Object.keys(originalMaps).forEach(key => {
      mapPairs[key] = originalMaps[key];
    });
    
    store.set("maps", mapPairs);
  });
}


export function setupFileHandlers() {
  ipcMain.handle('read-file', async (event, filePath) => {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return data;
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  });


  ipcMain.handle('dialog:selectFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
    });
    return result.filePaths[0];
  });


  ipcMain.handle('dialog:selectFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    return result.filePaths[0];
  });

}


export function setupMatchHandlers(matchPath) {
  
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
      const data = await fs.readFile(join(matchPath, match_json), 'utf8');
      console.log(data);
      return data;
    } catch (err) {
      console.error('Error reading match:', err);
      throw err;
    }
  });

  ipcMain.handle('load-match', async (event, sourcefile, num) => {
    try {
      await fs.copyFile(sourcefile, join(matchPath, `${num}.json`));
    } catch (error) {
      throw new Error(`Failed to load match: ${error.message}`);
    }
  });

  ipcMain.handle('copy-match', async (event, sourcefile, num) => {
    try {
      await fs.copyFile(sourcefile, join(matchPath, `${num}.json`));
    } catch (error) {
      throw new Error(`Failed to copy match: ${error.message}`);
    }
  });

  ipcMain.handle('delete-match', async (event, file) => {
    console.log("Deleting match:", file);
    const filePath = join(matchPath, file);
    await fs.unlink(filePath);
  });

  ipcMain.handle('delete-matches', async (event) => {
    try {
      const files = await fs.readdir(matchPath);
      for (const file of files) {
        const filePath = join(matchPath, file);
        await fs.unlink(filePath);
      }
    } catch (err) {
      console.error('Error deleting matches:', err);
    }
  });
}
