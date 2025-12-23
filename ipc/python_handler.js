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

    connect(host, port, onData, onMessage, onComplete, onError, onClose) {
        return new Promise((resolve, reject) => {
            // crate tcp client
            this.client = new net.Socket();

            //start registering handlers
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
                            onMessage({ type:"unparsed" , raw:message });
                        }
                    }
                }
            });

            this.client.on('end', () => {
                console.log('TCP connection ended');
                this.connected = false;

                if (onComplete) {
                    onComplete()
                };
            });

            this.client.on('close', () => {
                console.log('TCP connection closed');
                this.connected = false;
                if (onClose) {
                    onClose()
                };
            });

            this.client.on('error', (err) => {
                console.error('TCP client error:', err);
                if (onError) {
                    onError(err);
                }
                this.connected = false;

                reject(err);
            });

            // Actually connect
            this.client.connect(port, host, () => {
                console.log(`TCP client connected to ${host}:${port}`);
                this.connected = true;
                resolve();
            });


        });
    }

    disconnect(){
        if (this.client && this.connected) {
            this.client.end()
        }
        this.connected = false

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

            pythonProcess = spawn(`"${pythonpath} ${gameScript}"`, [...scriptArgs], {
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