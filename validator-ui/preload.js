const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('validatorAPI', {
  connectValidator: (validatorData) => ipcRenderer.invoke('connect-validator', validatorData),
  disconnectValidator: () => ipcRenderer.invoke('disconnect-validator'),
  onConnectionStatusChange: (callback) => {
    ipcRenderer.on('connection-status', (_, status) => callback(status));
  },
  onServerMessage: (callback) => {
    ipcRenderer.on('server-message', (_, message) => callback(message));
  },
  onValidatorRegistered: (callback) => {
    ipcRenderer.on('validator-registered', (_, data) => callback(data));
  },
  onValidationResult: (callback) => {
    ipcRenderer.on('validation-result', (_, result) => callback(result));
  }
}); 