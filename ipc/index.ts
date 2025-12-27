import ElectronStore from 'electron-store';
import { setupElectronStoreHandlers, setupFileHandlers, setupMatchHandlers } from './handlers.js';
import { setupPythonScriptHandlers} from './pythonHandlers.ts';

export function setupAllHandlers(store: ElectronStore, enginePath: string, matchPath: string) {
  setupElectronStoreHandlers(store, enginePath);
  setupFileHandlers();
  setupMatchHandlers(matchPath);
  setupPythonScriptHandlers(store, enginePath);
}
