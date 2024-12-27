const express = require('express');
const router = express.Router();
const ImmersveUser = require('./modelsImmersveUser');

const IMMERSVE_MASTER_CONTRACT = "UAKUGWMTFQJLUWMY4DYLVVAC67NOLUGGW6MIVAIPUU2APLTAKWSCQAJIEM";
const IMMERSVE_APP_ID = 2174001591;
const USDC_ASSET_ID = 31566704;

// Session check middleware
const sessionCheck = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// Get user data
router.get('/user/:username', sessionCheck, async (req, res) => {
  try {
    const user = await ImmersveUser.findOne({ twitterUsername: req.params.username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Register user
router.post('/register', sessionCheck, async (req, res) => {
  try {
    const { twitterUsername, immersveAddress, rewardAddress } = req.body;
    
    const user = await ImmersveUser.findOneAndUpdate(
      { twitterUsername },
      { immersveAddress, rewardAddress },
      { upsert: true, new: true }
    );
    
    res.json(user);
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Get transactions
router.get('/transactions', sessionCheck, async (req, res) => {
  const { address } = req.query;
  
  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }
  
  try {
    const response = await fetch(
      `https://mainnet-idx.4160.nodely.dev/v2/accounts/${address}/transactions?address=${IMMERSVE_MASTER_CONTRACT}`
    );
    
    const data = await response.json();
    const transactions = [];

    for (const tx of data.transactions) {
      const allTxns = [tx, ...(tx['inner-txns'] || [])];
      
      for (const t of allTxns) {
        if (
          t['tx-type'] === 'axfer' && 
          t['asset-transfer-transaction']?.['asset-id'] === USDC_ASSET_ID &&
          t['asset-transfer-transaction']?.receiver === IMMERSVE_MASTER_CONTRACT &&
          t['application-transaction']?.['application-id'] === IMMERSVE_APP_ID
        ) {
          transactions.push({
            amount: t['asset-transfer-transaction'].amount / 1000000, // Convert from microUSDC
            timestamp: new Date(tx['round-time'] * 1000).toISOString(),
            txId: tx.id
          });
        }
      }
    }

    res.json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

module.exports = router;