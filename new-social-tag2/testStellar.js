require('dotenv').config();
const { createVerificationTransaction } = require('./stellarService');

async function testStellar() {
  try {
    const testData = {
      id: 'test-id',
      timestamp: new Date().toISOString(),
      twitter: 'testTwitter',
      facebook: 'testFacebook'
    };

    console.log('Starting Stellar test...');
    const transactionHash = await createVerificationTransaction(testData);
    console.log('Transaction successful. Hash:', transactionHash);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testStellar();