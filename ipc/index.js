const { setupElectronStoreHandlers, setupFileHandlers, setupMatchHandlers } = require('./handlers');
const { setupPythonScriptHandlers} = require('./python_handler');

function setupAllHandlers(store, enginePath, matchPath, dataFilePath) {
  setupElectronStoreHandlers(store);
  setupFileHandlers(dataFilePath, enginePath);
  setupMatchHandlers(matchPath);
  setupPythonScriptHandlers(store, enginePath);

}

module.exports = { setupAllHandlers };