const { ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const TcpClientManager = require('../tcp/tcpClient');
const { getFreePort } = require('../utils/portUtils');

let pythonProcess = null;
let tcpClientManager = null;

function setupPythonScriptHandlers(store, enginePath) {
  
  ipcMain.handle('run-python-script', async (event, scriptArgs) => {
    console.log('ipcMain.handle called with args:', scriptArgs);
    
    return new Promise(async (resolve, reject) => {
      console.log('Running python script with args:', scriptArgs);

      const pythonpath = store.get("pythonpath");
      const python_script = 'local_server.py';
      const gameScript = path.join(enginePath, python_script);

      const port = await getFreePort();
      scriptArgs.push('--output_port', port.toString());

      let scriptOutput = '';
      let scriptError = '';
      let tcpResult = null;
      
      // Create new TCP client manager
      tcpClientManager = new TcpClientManager();
      
      pythonProcess = spawn(`"${pythonpath} ${gameScript}"`, [...scriptArgs], {
        cwd: enginePath,
        shell: true
      });
      
      // Stream stdout for debugging
      pythonProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        scriptOutput += chunk;
        event.sender.send('stream-output', chunk);
      });
      
      // Stream stderr for errors
      pythonProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        scriptError += chunk;
        event.sender.send('stream-error', chunk);
      });
      
      pythonProcess.on('close', (code) => {
        if (tcpClientManager) {
          tcpClientManager.disconnect();
        }
        
        event.sender.send('stream-complete', {
          code,
          stdout: scriptOutput,
          tcpData: tcpResult
        });
        
        if (code !== 0) {
          reject(new Error(`Python script error: ${scriptError}`));
        } else {
          resolve(tcpResult);
        }
      });
      
      pythonProcess.on('error', (err) => {
        if (tcpClientManager) {
          tcpClientManager.disconnect();
        }
        reject(err);
      });
      
      // Connect TCP client
      setTimeout(async () => {
        try {
          await tcpClientManager.connect(
            '127.0.0.1',
            port,
            (chunk) => {
              event.sender.send('stream-tcp-data', chunk);
            },
            (jsonData) => {
              tcpResult = jsonData;
              console.log('TCP data received and parsed');
            },
            (err) => {
              console.error('TCP connection error:', err);
            }
          );
        } catch (err) {
          console.error('Failed to connect TCP client:', err);
        }
      }, 500);
    });
  });

  ipcMain.handle('send-interrupt', async () => {
    if (tcpClientManager) {
      return tcpClientManager.sendInterrupt();
    }
    return false;
  });

  ipcMain.handle('send-tcp-message', async (event, message) => {
    if (tcpClientManager) {
      return tcpClientManager.sendMessage(message);
    }
    return false;
  });

  ipcMain.handle('tcp-connected', async () => {
    return tcpClientManager ? tcpClientManager.connected : false;
  });

  return () => {
    if (pythonProcess && !pythonProcess.killed) {
      pythonProcess.kill();
    }
    if (tcpClientManager) {
      tcpClientManager.disconnect();
    }
  };
}

module.exports = { setupPythonScriptHandlers, getPythonProcess: () => pythonProcess };