const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const WebSocket = require('ws');
const { Keypair } = require('@solana/web3.js');
const nacl = require('tweetnacl');
const nacl_util = require('tweetnacl-util');
const { v7: uuidv7 } = require('uuid');

let mainWindow;
let validatorSocket;
let validatorId = null;
const CALLBACKS = {};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');
  
  // Open DevTools in development
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

// Helper function to sign messages
async function signMessage(message, keypair) {
  const messageBytes = nacl_util.decodeUTF8(message);
  const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
  return JSON.stringify(Array.from(signature));
}

// Handle validator connection
ipcMain.handle('connect-validator', async (event, validatorData) => {
  try {
    if (validatorSocket) {
      validatorSocket.close();
    }
    
    // Create keypair from private key if provided, otherwise from public key
    let keypair;
    try {
      if (validatorData.privateKey) {
        keypair = Keypair.fromSecretKey(
          Uint8Array.from(JSON.parse(validatorData.privateKey))
        );
      } else {
        // For testing only - in production, you'll need the private key
        console.warn('No private key provided - using demo keypair');
        keypair = new Keypair();
      }
    } catch (error) {
      return { success: false, error: 'Invalid private key format: ' + error.message };
    }
    
    // Connect to websocket server
    validatorSocket = new WebSocket(validatorData.serverUrl);
    
    // Connection opened
    validatorSocket.on('open', async () => {
      console.log('Connected to websocket server');
      mainWindow.webContents.send('connection-status', { status: 'connected' });
      
      // Generate a callback ID
      const callbackId = uuidv7();
      
      // Set up callback handler
      CALLBACKS[callbackId] = (data) => {
        validatorId = data.validatorId;
        mainWindow.webContents.send('validator-registered', { 
          validatorId: validatorId 
        });
      };
      
      // Sign the message for authentication
      const signedMessage = await signMessage(
        `Signed message for ${callbackId}, ${keypair.publicKey}`, 
        keypair
      );
      
      // Send validator signup data
      const signupData = {
        type: 'signup',
        data: {
          callbackId,
          ip: '127.0.0.1', // Local IP for the UI app
          publicKey: keypair.publicKey.toString(),
          signedMessage,
        },
      };
      
      validatorSocket.send(JSON.stringify(signupData));
    });
    
    // Listen for messages
    validatorSocket.on('message', async (data) => {
      try {
        const message = JSON.parse(data);
        mainWindow.webContents.send('server-message', message);
        
        // Handle different message types
        if (message.type === 'signup') {
          if (CALLBACKS[message.data.callbackId]) {
            CALLBACKS[message.data.callbackId](message.data);
            delete CALLBACKS[message.data.callbackId];
          }
        } else if (message.type === 'validate') {
          await validateHandler(validatorSocket, message.data, keypair);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
    
    // Connection error
    validatorSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
      mainWindow.webContents.send('connection-status', { 
        status: 'error', 
        message: error.message 
      });
    });
    
    // Connection closed
    validatorSocket.on('close', () => {
      console.log('Connection closed');
      mainWindow.webContents.send('connection-status', { status: 'disconnected' });
    });
    
    return { success: true };
  } catch (error) {
    console.error('Connection error:', error);
    return { success: false, error: error.message };
  }
});

// Handle validate requests
async function validateHandler(ws, { url, callbackId, websiteId }, keypair) {
  console.log(`Validating ${url}`);
  const startTime = Date.now();
  const signature = await signMessage(`Replying to ${callbackId}`, keypair);

  try {
    const response = await fetch(url);
    const endTime = Date.now();
    const latency = endTime - startTime;
    const status = response.status;

    console.log(`Validation result for ${url}: Status ${status}`);
    mainWindow.webContents.send('validation-result', {
      url,
      status,
      latency
    });
    
    ws.send(JSON.stringify({
      type: 'validate',
      data: {
        callbackId,
        status: status === 200 ? 'Good' : 'Bad',
        latency,
        websiteId,
        validatorId,
        signedMessage: signature,
      },
    }));
  } catch (error) {
    console.error('Validation error:', error);
    mainWindow.webContents.send('validation-result', {
      url,
      status: 'Bad',
      latency: 1000,
      error: error.message
    });
    
    ws.send(JSON.stringify({
      type: 'validate',
      data: {
        callbackId,
        status: 'Bad',
        latency: 1000,
        websiteId,
        validatorId,
        signedMessage: signature,
      },
    }));
  }
}

// Disconnect from server
ipcMain.handle('disconnect-validator', async (event) => {
  if (validatorSocket) {
    validatorSocket.close();
    validatorId = null;
    return { success: true };
  }
  return { success: false, error: 'Not connected' };
}); 