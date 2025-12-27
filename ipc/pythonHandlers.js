const { ipcMain } = require('electron');
const { spawn, exec } = require('child_process');
const path = require('path');
const net = require('net');

let pythonProcess = null;
let tcpClientManager = null;


function getFreePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(0, () => {
            const { port } = server.address();
            server.close(() => resolve(port));
        });
        server.on("error", reject);
    });
}

function closeTCPClient(){
     if (tcpClientManager) {
        tcpClientManager.disconnect();
    }
}

function closePython(){
    if (pythonProcess && !pythonProcess.killed) {
        pythonProcess.kill();
    }

    if (pythonProcess && !pythonProcess.killed) {
        console.log(`Killing process ${pythonProcess.pid}`);
        if (process.platform === "win32") {
          exec(`taskkill /PID ${pythonProcess.pid} /T /F`, (err) => {
            if (err) console.error("Failed to kill process:", err);
            else console.log("Process killed");
          });
        } else {
          exec(`kill -9 ${pythonProcess.pid}`, (err) => {
            if (err) console.error("Failed to kill process:", err);
            else console.log("Process killed");
          });
        }
    }
}

class TcpClientManager {
    constructor() {
        this.client = null;
        this.connected = false;
        this.dataBuffer = '';
        this.messageBuffer = ''; // For handling partial messages
    }

    async connect(host, port, onData, onMessage, onComplete, onError, onClose, maxRetries = 20, initialDelay = 100) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                await this._attemptConnect(host, port, onData, onMessage, onComplete, onError, onClose);
                console.log(`Successfully connected to TCP server on port ${port}`);
                return; // Success!
            } catch (error) {
                if (attempt === maxRetries - 1) {
                    throw new Error(`Failed to connect after ${maxRetries} attempts: ${error.message}`);
                }
                
                const delay = Math.min(initialDelay * Math.pow(1.5, attempt), 2000);
                console.log(`Connection attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    _attemptConnect(host, port, onData, onMessage, onComplete, onError, onClose) {
        return new Promise((resolve, reject) => {
            // Create tcp client
            this.client = new net.Socket();

            // Set connection timeout
            const connectionTimeout = setTimeout(() => {
                this.client.destroy();
                reject(new Error('Connection timeout'));
            }, 2000);

            // Start registering handlers
            this.client.on('data', (data) => {
                const chunk = data.toString();
                this.dataBuffer += chunk;
                this.messageBuffer += chunk;

                // Send raw data to renderer (for debugging)
                if (onData) onData(chunk);

                while (this.messageBuffer.includes('\n')) {
                    const newlineIndex = this.messageBuffer.indexOf('\n');
                    const message = this.messageBuffer.substring(0, newlineIndex);
                    this.messageBuffer = this.messageBuffer.substring(newlineIndex + 1);

                    if (message.trim() && onMessage) {
                        try {
                            const jsonMessage = JSON.parse(message);
                            onMessage(jsonMessage);
                        } catch (e) {
                            console.warn('Received non-JSON message:', message);
                            onMessage({ type: "unparsed", raw: message });
                        }
                    }
                }
            });

            this.client.on('end', () => {
                console.log('TCP connection ended');
                this.connected = false;

                if (onComplete) {
                    onComplete();
                }
            });

            this.client.on('close', () => {
                console.log('TCP connection closed');
                this.connected = false;
                if (onClose) {
                    onClose();
                }
            });

            this.client.on('error', (err) => {
                clearTimeout(connectionTimeout);
                console.error('TCP client error:', err);
                
                // Only call onError for errors after successful connection
                if (this.connected && onError) {
                    onError(err);
                }
                
                this.connected = false;
                reject(err);
            });

            // Actually connect
            this.client.connect(port, host, () => {
                clearTimeout(connectionTimeout);
                console.log(`TCP client connected to ${host}:${port}`);
                this.connected = true;
                resolve();
            });
        });
    }

    disconnect() {
        if (this.client && this.connected) {
            this.client.end();
        }
        this.connected = false;
    }

    sendInterrupt() {
        if (this.client && this.connected) {
            console.log('Sending interrupt message');
            const interruptMessage = JSON.stringify({ type: 'terminate' }) + '\n';
            this.client.write(interruptMessage);
            return true;
        }
    }
}



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


            console.log("running")
            console.log(`"${pythonpath} ${gameScript} ${[...scriptArgs]}"`)

            pythonProcess = spawn(`"${pythonpath}" "${gameScript}"`, [...scriptArgs], {
                cwd: enginePath,
                shell: true
            });

            // Stream stdout for debugging
            pythonProcess.stdout.on('data', (data) => {
                const chunk = data.toString();
                scriptOutput += chunk;
                event.sender.send('stream-output', chunk);
                event.sender.send('stream-output-full', scriptOutput);
            });

            // Stream stderr for errors
            pythonProcess.stderr.on('data', (data) => {
                const chunk = data.toString();
                scriptError += chunk;
                event.sender.send('stream-error', chunk);
                event.sender.send('stream-error-full', scriptError);
            });

            pythonProcess.on('close', (code) => {
                if (tcpClientManager) {
                    tcpClientManager.disconnect();
                }

                event.sender.send('stream-complete', {
                    code,
                    stdout: scriptOutput,
                });

                if (code !== 0) {
                    reject(new Error(`Python script error: ${scriptError}`));
                } else {
                    resolve(scriptOutput);
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
                        '127.0.0.1', // host
                        port, // port
                        (chunk) => { // onData
                            event.sender.send('stream-tcp-data', chunk);
                            console.log('TCP data received');
                        },
                        (jsonData) => { // onMessage
                            event.sender.send('stream-tcp-json', jsonData);
                            console.log('TCP data parsed');
                            tcpResult = jsonData;
                        }, 
                        () => { // onComplete
                            event.sender.send('stream-tcp-status', "complete");
                        },
                        (err) => { // onError
                            event.sender.send('stream-tcp-status', "error");
                            console.error('TCP connection error:', err);
                        },
                        () => { // onClose
                            event.sender.send('stream-tcp-status', "close");
                        },
                    );
                } catch (err) {
                    console.error('Failed to connect TCP client:', err);
                }
            }, 500);
        });
    });

    ipcMain.handle('tcp-send-interrupt', async (event) => {
        if (tcpClientManager) {
            return tcpClientManager.sendInterrupt();
        }
        return false;
    });


    ipcMain.handle('tcp-disconnect', async (event) => {
        if (tcpClientManager) {
            tcpClientManager.disconnect()
        }
        return False
    });
}





module.exports = { 
    setupPythonScriptHandlers, 
    closePython,
    closeTCPClient,
    getPythonProcess: () => pythonProcess,
    getTCPClient: () => tcpClientManager
};