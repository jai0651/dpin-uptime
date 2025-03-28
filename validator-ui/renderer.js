document.addEventListener('DOMContentLoaded', () => {
  const validatorForm = document.getElementById('validator-form');
  const nameInput = document.getElementById('name');
  const privateKeyInput = document.getElementById('privateKey');
  const serverUrlInput = document.getElementById('serverUrl');
  const connectBtn = document.getElementById('connect-btn');
  const disconnectBtn = document.getElementById('disconnect-btn');
  const statusIndicator = document.getElementById('status-indicator');
  const statusMessage = document.getElementById('status-message');
  const validatorIdDisplay = document.getElementById('validator-id');
  const validationResultsContainer = document.getElementById('validation-results');
  const messagesContainer = document.getElementById('messages');

  // Handle form submission (connect)
  validatorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const validatorData = {
      name: nameInput.value.trim(),
      privateKey: privateKeyInput.value.trim(),
      serverUrl: serverUrlInput.value.trim()
    };
    
    // Show connecting status
    updateConnectionStatus({
      status: 'connecting',
    });
    
    try {
      const result = await window.validatorAPI.connectValidator(validatorData);
      
      if (!result.success) {
        updateConnectionStatus({
          status: 'error',
          message: result.error
        });
      }
    } catch (error) {
      console.error('Connection error:', error);
      updateConnectionStatus({
        status: 'error',
        message: error.message
      });
    }
  });
  
  // Handle disconnect button
  disconnectBtn.addEventListener('click', async () => {
    try {
      await window.validatorAPI.disconnectValidator();
      validatorIdDisplay.textContent = '';
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  });
  
  // Listen for connection status changes
  window.validatorAPI.onConnectionStatusChange((status) => {
    updateConnectionStatus(status);
  });
  
  // Listen for validator registration
  window.validatorAPI.onValidatorRegistered((data) => {
    validatorIdDisplay.textContent = `Validator ID: ${data.validatorId}`;
  });
  
  // Listen for validation results
  window.validatorAPI.onValidationResult((result) => {
    appendValidationResult(result);
  });
  
  // Listen for server messages
  window.validatorAPI.onServerMessage((message) => {
    appendMessage(message);
  });
  
  // Update UI based on connection status
  function updateConnectionStatus(status) {
    statusIndicator.className = 'status ' + status.status;
    
    switch (status.status) {
      case 'connected':
        statusIndicator.textContent = 'Connected';
        connectBtn.disabled = true;
        disconnectBtn.disabled = false;
        statusMessage.textContent = '';
        break;
        
      case 'disconnected':
        statusIndicator.textContent = 'Disconnected';
        connectBtn.disabled = false;
        disconnectBtn.disabled = true;
        statusMessage.textContent = '';
        break;
        
      case 'connecting':
        statusIndicator.textContent = 'Connecting...';
        connectBtn.disabled = true;
        disconnectBtn.disabled = true;
        statusMessage.textContent = '';
        break;
        
      case 'error':
        statusIndicator.textContent = 'Error';
        connectBtn.disabled = false;
        disconnectBtn.disabled = true;
        statusMessage.textContent = status.message || 'An unknown error occurred';
        break;
    }
  }
  
  // Add validation result to the results container
  function appendValidationResult(result) {
    const resultElement = document.createElement('div');
    resultElement.className = `validation-result ${result.status === 'Good' || result.status === 200 ? 'validation-success' : 'validation-error'}`;
    
    const urlElement = document.createElement('div');
    urlElement.innerHTML = `<strong>URL:</strong> ${result.url}`;
    
    const statusElement = document.createElement('div');
    statusElement.innerHTML = `<strong>Status:</strong> ${result.status}`;
    
    const latencyElement = document.createElement('div');
    latencyElement.innerHTML = `<strong>Latency:</strong> ${result.latency}ms`;
    
    resultElement.appendChild(urlElement);
    resultElement.appendChild(statusElement);
    resultElement.appendChild(latencyElement);
    
    if (result.error) {
      const errorElement = document.createElement('div');
      errorElement.innerHTML = `<strong>Error:</strong> ${result.error}`;
      resultElement.appendChild(errorElement);
    }
    
    validationResultsContainer.appendChild(resultElement);
    validationResultsContainer.scrollTop = validationResultsContainer.scrollHeight;
  }
  
  // Add message to the messages container
  function appendMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.textContent = JSON.stringify(message, null, 2);
    messagesContainer.appendChild(messageElement);
    
    // Scroll to the latest message
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}); 