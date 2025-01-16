const { spawn } = require('child_process');
const schedule = require('node-schedule');
const path = require('path');
const User = require('./modelsUser');
const Statistics = require('./modelsStatistics');
require('dotenv').config();

const IMMERSVE_MASTER_CONTRACT = "UAKUGWMTFQJLUWMY4DYLVVAC67NOLUGGW6MIVAIPUU2APLTAKWSCQAJIEM";
const USDC_ASSET_ID = 31566704;

// Define reward pools and rates
const REWARD_POOLS = {
  SOCIALS: {
    assetId: 2607097066,
    rewardRate: 1000000000000, // 1M tokens per 1 USDC
    totalPool: 8000000000000000
  }
};

async function fetchUserTransactions(address, lastProcessedTime) {
  try {
    console.log('Fetching transactions for address:', address);
    console.log('Last processed time:', lastProcessedTime);
    
    const response = await fetch(
      `https://mainnet-idx.4160.nodely.dev/v2/accounts/${address}/transactions?address=${IMMERSVE_MASTER_CONTRACT}&after-time=${lastProcessedTime.toISOString()}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch from indexer');
    }
    
    const data = await response.json();
    const transactions = [];

    // Process both main and inner transactions
    for (const tx of data.transactions || []) {
      // Check main transaction
      if (
        tx['tx-type'] === 'axfer' &&
        tx['asset-transfer-transaction']?.['asset-id'] === USDC_ASSET_ID &&
        tx['asset-transfer-transaction']?.receiver === IMMERSVE_MASTER_CONTRACT
      ) {
        transactions.push({
          amount: tx['asset-transfer-transaction'].amount / 1000000, // Convert to USDC units
          timestamp: new Date(tx['round-time'] * 1000),
          txId: tx.id,
          isInnerTx: false
        });
      }

      // Check inner transactions
      if (tx['inner-txns']) {
        for (const innerTx of tx['inner-txns']) {
          if (
            innerTx['tx-type'] === 'axfer' &&
            innerTx['asset-transfer-transaction']?.['asset-id'] === USDC_ASSET_ID &&
            innerTx['asset-transfer-transaction']?.receiver === IMMERSVE_MASTER_CONTRACT
          ) {
            transactions.push({
              amount: innerTx['asset-transfer-transaction'].amount / 1000000, // Convert to USDC units
              timestamp: new Date(tx['round-time'] * 1000),
              txId: tx.id,
              isInnerTx: true
            });
          }
        }
      }
    }

    console.log('Found transactions:', transactions.length);
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

async function getUserOptedInAssets(address) {
  try {
    const response = await fetch(
      `https://mainnet-idx.4160.nodely.dev/v2/accounts/${address}/assets`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch assets');
    }
    
    const data = await response.json();
    console.log('Fetched opted-in assets for address:', address);
    const optedInAssets = data.assets.map(asset => asset['asset-id']);
    console.log('User opted-in assets:', optedInAssets);
    return optedInAssets;
  } catch (error) {
    console.error('Error fetching user assets:', error);
    return [];
  }
}

async function processRewards(transaction, optedInAssets) {
  const rewards = [];
  
  // Calculate rewards for each pool
  for (const [token, pool] of Object.entries(REWARD_POOLS)) {
    if (optedInAssets.includes(pool.assetId)) {
      const rewardAmount = Math.floor(transaction.amount * pool.rewardRate);
      rewards.push({
        token,
        assetId: pool.assetId,
        amount: rewardAmount
      });
    }
  }
  
  return rewards;
}

async function distributeRewards(rewardAddress, transaction, rewards) {
  return new Promise((resolve, reject) => {
    console.log('Starting Python process for reward distribution');
    const pythonProcess = spawn('python', [
      path.join(__dirname, 'immersve_rewards.py')
    ]);

    const data = {
      receiver: rewardAddress,
      usdc_amount: transaction.amount,
      opted_in_assets: rewards.map(r => r.assetId),
      rewards: rewards.map(r => ({
        asset_id: r.assetId,
        amount: r.amount
      }))
    };

    console.log('Sending data to Python script:', JSON.stringify(data, null, 2));

    pythonProcess.stdin.write(JSON.stringify(data));
    pythonProcess.stdin.end();

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      console.log('Python script output:', chunk);
      result += chunk;
    });

    pythonProcess.stderr.on('data', (data) => {
      const chunk = data.toString();
      console.log('Python script error:', chunk);
      error += chunk;
    });

    pythonProcess.on('close', (code) => {
      console.log('Python process closed with code:', code);
      console.log('Final result:', result);
      console.log('Final error:', error);

      if (code !== 0) {
        reject(new Error(`Distribution failed: ${error}`));
      } else {
        try {
          const response = JSON.parse(result);
          console.log('Parsed response:', response);
          resolve(response.tx_ids);
        } catch (e) {
          console.log('JSON parse error:', e);
          console.log('Failed to parse result:', result);
          reject(new Error(`Failed to parse Python script response: ${e.message}`));
        }
      }
    });
  });
}

async function updateStats(rewards, rewardAddress, rewardTxIds) {
  const stats = await Statistics.findOne({ type: 'reward_pool' }) || new Statistics({ type: 'reward_pool' });
  
  for (const [index, reward] of rewards.entries()) {
    if (reward.token === 'SOCIALS') {
      stats.socials_distributed = (stats.socials_distributed || 0) + reward.amount;
      
      // Add transaction to history
      stats.rewardTransactions.push({
        txId: rewardTxIds[index],
        amount: reward.amount,
        assetId: reward.assetId,
        token: reward.token,
        recipientAddress: rewardAddress,
        timestamp: new Date()
      });
    }
  }
  
  await stats.save();
}

async function processUserRewards(user) {
  try {
    console.log('Processing rewards for user:', user.twitter?.username);
    const lastProcessedTime = user.lastProcessedTimestamp || new Date(0);
    const transactions = await fetchUserTransactions(user.immersveAddress, lastProcessedTime);
    
    console.log('Found transactions:', transactions.length);
    
    if (transactions.length === 0) {
      return;
    }

    const optedInAssets = await getUserOptedInAssets(user.immersveRewardAddress);
    console.log('User opted in assets:', optedInAssets);
    
    for (const transaction of transactions) {
      console.log('Processing transaction:', transaction);
      // Calculate rewards for all pools user is opted into
      const rewards = await processRewards(transaction, optedInAssets);
      console.log('Calculated rewards:', rewards);
      
      if (rewards.length > 0) {
        // Distribute rewards using Python script
        const rewardTxIds = await distributeRewards(user.immersveRewardAddress, transaction, rewards);
        console.log('Reward distribution txIds:', rewardTxIds);
        
        // Update user's transaction record
        const rewardRecords = rewards.map((reward, index) => ({
          assetId: reward.assetId,
          amount: reward.amount,
          txId: rewardTxIds[index],
          timestamp: new Date()
        }));

        // Add to user's immersveTransactions array
        user.immersveTransactions.push({
          usdcAmount: transaction.amount,
          timestamp: transaction.timestamp,
          txId: transaction.txId,
          rewards: rewardRecords,
          processed: true
        });

        // Update pool statistics
        await updateStats(rewards, user.immersveRewardAddress, rewardTxIds);
      }
    }

    // Update last processed timestamp
    user.lastProcessedTimestamp = new Date();
    await user.save();
    console.log('Updated user record with new transactions and timestamp');
    
  } catch (error) {
    console.error(`Error processing rewards for user ${user.twitter?.username}:`, error);
  }
}

async function runRewardProcessor() {
  console.log('Starting reward processing at:', new Date().toISOString());
  
  try {
    // Find all users with Immersve addresses configured
    const users = await User.find({
      immersveAddress: { $ne: null },
      immersveRewardAddress: { $ne: null }
    });

    console.log(`Found ${users.length} users with Immersve addresses`);

    // Process each user's rewards
    for (const user of users) {
      await processUserRewards(user);
    }

    console.log('Reward processing completed at:', new Date().toISOString());
  } catch (error) {
    console.error('Error in reward processor:', error);
  }
}

async function runTestTransactions() {
  console.log('Starting test transaction simulation...');
  
  try {
    // Find all users with Immersve addresses configured
    const users = await User.find({
      immersveAddress: { $ne: null },
      immersveRewardAddress: { $ne: null }
    });

    console.log(`Found ${users.length} users for test transactions`);

    // Test transaction data
    const testTransactions = [
      {
        amount: 4.57,
        timestamp: new Date(Date.now() - 15 * 60000), // 15 minutes ago
        txId: 'TEST_TX_' + Date.now() + '_1',
        isInnerTx: false
      },
      {
        amount: 16.32,
        timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
        txId: 'TEST_TX_' + Date.now() + '_2',
        isInnerTx: false
      }
    ];

    for (const user of users) {
      console.log(`Processing test transactions for user: ${user.twitter?.username}`);
      
      // Get user's opted-in assets
      const optedInAssets = await getUserOptedInAssets(user.immersveRewardAddress);
      console.log('User opted in assets:', optedInAssets);

      // Process each test transaction
      for (const transaction of testTransactions) {
        console.log('Processing test transaction:', transaction);
        
        // Calculate rewards
        const rewards = await processRewards(transaction, optedInAssets);
        console.log('Calculated test rewards:', rewards);

        if (rewards.length > 0) {
          // Distribute rewards using Python script
          const rewardTxIds = await distributeRewards(user.immersveRewardAddress, transaction, rewards);
          console.log('Test reward distribution txIds:', rewardTxIds);

          // Update user's transaction record
          const rewardRecords = rewards.map((reward, index) => ({
            assetId: reward.assetId,
            amount: reward.amount,
            txId: rewardTxIds[index],
            timestamp: new Date()
          }));

          // Add to user's immersveTransactions array
          user.immersveTransactions.push({
            usdcAmount: transaction.amount,
            timestamp: transaction.timestamp,
            txId: transaction.txId,
            rewards: rewardRecords,
            processed: true
          });

          // Update pool statistics
          await updateStats(rewards, user.immersveRewardAddress, rewardTxIds);
        }
      }

      // Save user updates
      await user.save();
      console.log(`Completed test transactions for user: ${user.twitter?.username}`);
    }

    console.log('Test transaction simulation completed');
  } catch (error) {
    console.error('Error in test transaction simulation:', error);
  }
}

// Run every 30 minutes
const job = schedule.scheduleJob('*/30 * * * *', async () => {
  await runRewardProcessor();
  await runTestTransactions();  // This would run after each reward processing
});

console.log('Reward processor initialized - will run every 30 minutes');
console.log('Next scheduled run:', job.nextInvocation().toString());

// Call test transaction simulation
runTestTransactions();

module.exports = {
  runRewardProcessor,
  runTestTransactions,
  initializeRewardProcessor: () => {}
};