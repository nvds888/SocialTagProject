const express = require('express');
const router = express.Router();
const peraWalletService = require('./perawalletservice');

router.post('/create-permanentafy-txn', async (req, res) => {
  try {
    const { receiverAddress, username, verifiedAccounts, profileUrl } = req.body;
    const transactions = await peraWalletService.createPermanentafyTransaction(
      receiverAddress, 
      username, 
      verifiedAccounts, 
      profileUrl
    );
    res.json(transactions);
  } catch (error) {
    console.error('Error in create-permanentafy-txn route:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/submit-transaction', async (req, res) => {
  try {
    const { signedTxn } = req.body;
    const txId = await peraWalletService.submitSignedTransaction(signedTxn);
    res.json({ txId });
  } catch (error) {
    console.error('Error submitting signed transaction:', error);
    res.status(500).json({ error: 'Failed to submit signed transaction' });
  }
});

router.get('/fetch-wallet-nfts/:address', async (req, res) => {
  try {
    const { address } = req.params;
    console.log(`Fetching NFTs for address: ${address}`);
    const nfts = await peraWalletService.fetchWalletNFTs(address);
    res.json(nfts);
  } catch (error) {
    console.error('Error fetching wallet NFTs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch wallet NFTs',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// New route for fetching NFDs
router.get('/fetch-wallet-nfds/:address', async (req, res) => {
  try {
    const { address } = req.params;
    console.log(`Fetching NFDs for address: ${address}`);
    const nfds = await peraWalletService.fetchWalletNFDs(address);
    res.json(nfds);
  } catch (error) {
    console.error('Error fetching wallet NFDs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch wallet NFDs',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;