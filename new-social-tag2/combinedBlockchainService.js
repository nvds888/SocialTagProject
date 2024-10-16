const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();

function createAlgorandVerificationTransaction(verificationData) {
  return new Promise((resolve, reject) => {
    console.log('Starting Algorand verification process...');
    const pythonScriptPath = path.join(__dirname, 'algorand_verify.py');
    
    // Properly escape and quote the JSON string
    const escapedJson = JSON.stringify(verificationData).replace(/"/g, '\\"');
    const pythonProcess = spawn('python', [pythonScriptPath, `"${escapedJson}"`]);

    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Algorand Python script exited with code ${code}. Error: ${error}`);
        reject(new Error(`Algorand verification failed. Error: ${error}`));
      } else {
        // Parse the output to extract the transaction ID
        const txIdMatch = output.match(/AlgorandTransactionID:(\w+)/);
        if (txIdMatch && txIdMatch[1]) {
          console.log('Algorand transaction created successfully');
          resolve(txIdMatch[1]);
        } else {
          reject(new Error(`Failed to extract AlgorandTransactionID from output: ${output}`));
        }
      }
    });
  });
}

async function createVerificationTransaction(verificationData) {
  try {
    console.log('Starting verification process with data:', verificationData);
    const algorandTxId = await createAlgorandVerificationTransaction(verificationData);

    console.log('Verification process completed');
    console.log('Algorand Transaction ID:', algorandTxId);

    return {
      algorand: algorandTxId
    };
  } catch (error) {
    console.error('Error in createVerificationTransaction:', error);
    throw error;
  }
}

module.exports = { createVerificationTransaction };