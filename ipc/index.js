const { setupStorageHandlers } = require('./handlers');
const { setupFileHandlers } = require('./python_handler');

function setupAllHandlers(store, enginePath, matchPath, dataFilePath) {
  const cleanupPython = setupPythonScriptHandlers(store, enginePath);
  setupStorageHandlers(store);
  setupFileHandlers(matchPath, dataFilePath, enginePath);
  setupMatchHandlers(matchPath);
  
  return cleanupPython; // Return cleanup function
}

module.exports = { setupAllHandlers };