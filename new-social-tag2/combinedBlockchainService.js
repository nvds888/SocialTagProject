const StellarSdk = require('@stellar/stellar-sdk');
const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
const sourceSecretKey = process.env.STELLAR_SECRET_KEY;
const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecretKey);
const sourcePublicKey = sourceKeypair.publicKey();

async function createStellarVerificationTransaction(verificationData) {
  try {
    console.log('Fetching Stellar account...');
    const account = await server.loadAccount(sourcePublicKey);
    console.log('Stellar account fetched successfully');

    console.log('Building Stellar transaction...');
    const transaction = new StellarSdk.TransactionBuilder(account, { 
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET
    })
      .addOperation(StellarSdk.Operation.manageData({
        name: 'verification',
        value: Buffer.from(JSON.stringify(verificationData)).toString('base64').slice(0, 64)
      }))
      .setTimeout(30)
      .build();

    console.log('Stellar transaction built successfully');

    console.log('Signing Stellar transaction...');
    transaction.sign(sourceKeypair);
    console.log('Stellar transaction signed successfully');

    console.log('Submitting Stellar transaction...');
    const transactionResult = await server.submitTransaction(transaction);
    console.log('Stellar transaction submitted successfully');
    
    return transactionResult.hash;
  } catch (error) {
    console.error('Error in createStellarVerificationTransaction:', error);
    if (error.response) {
      console.error('Stellar error response:', error.response.data);
    }
    throw error;
  }
}

function createAlgorandVerificationTransaction(verificationData) {
  return new Promise((resolve, reject) => {
    console.log('Starting Algorand verification process...');
    const pythonScriptPath = path.join(__dirname, 'algorand_verify.py');
    const pythonProcess = spawn('python', [pythonScriptPath, JSON.stringify(verificationData)]);

    let transactionId = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      transactionId += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Algorand Python script exited with code ${code}. Error: ${error}`);
        reject(new Error(`Algorand verification failed. Error: ${error}`));
      } else {
        console.log('Algorand transaction created successfully');
        resolve(transactionId.trim());
      }
    });
  });
}

async function createVerificationTransaction(verificationData) {
  try {
    console.log('Starting verification process with data:', verificationData);
    const [stellarHash, algorandTxId] = await Promise.all([
      createStellarVerificationTransaction(verificationData),
      createAlgorandVerificationTransaction(verificationData)
    ]);

    console.log('Verification process completed');
    console.log('Stellar Transaction Hash:', stellarHash);
    console.log('Algorand Transaction ID:', algorandTxId);

    return {
      stellar: stellarHash,
      algorand: algorandTxId
    };
  } catch (error) {
    console.error('Error in createVerificationTransaction:', error);
    throw error;
  }
}

module.exports = { createVerificationTransaction };