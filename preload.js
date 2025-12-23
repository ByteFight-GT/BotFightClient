const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    //electron handlers
    storeSet: (key, value) => ipcRenderer.invoke('store-set', key, value),
    storeGet: (key) => ipcRenderer.invoke('store-get', key),

    //file/metadata handlers
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    readMap: () => ipcRenderer.invoke('read-map'),
    writeMap: (mapPairs) => ipcRenderer.invoke('write-map', mapPairs),

    deleteMap: (mapName) => ipcRenderer.invoke('delete-map', mapName),
    deleteMaps: () => ipcRenderer.invoke('delete-maps'),
    selectFile: () => ipcRenderer.invoke('dialog:selectFile'),
    selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),

    // match handlers
    writeMatch: (num, match) => ipcRenderer.invoke('write-match', num, match),
    getMatches: () => ipcRenderer.invoke('get-matches'),
    deleteMatch: (matchName) => ipcRenderer.invoke('delete-match', matchName),
    deleteMatches: () => ipcRenderer.invoke('delete-matches'),
    readMatch: (match_json) => ipcRenderer.invoke('read-match', match_json),
    copyMatch: (sourcefile, num) => ipcRenderer.invoke('copy-match', sourcefile, num),

    // python script handlers
    runPythonScript: (args, directoryPath) => ipcRenderer.invoke('run-python-script', args, directoryPath),
    sendTCPInterrupt: () => ipcRenderer.invoke('tcp-send-interrupt'),
    disconnectTCP: () => ipcRenderer.invoke('tcp-disconnect')
});