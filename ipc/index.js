const { setupElectronStoreHandlers, setupFileHandlers, setupMatchHandlers } = require('./handlers');
const { setupPythonScriptHandlers} = require('./pythonHandlers');

function setupAllHandlers(store, enginePath, matchPath) {
  setupElectronStoreHandlers(store, enginePath);
  setupFileHandlers();
  setupMatchHandlers(matchPath);
  setupPythonScriptHandlers(store, enginePath);

}

module.exports = { setupAllHandlers };