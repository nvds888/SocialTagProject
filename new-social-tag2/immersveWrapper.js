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
    rewardRate: 1000000, // 1M tokens per 1 USDC
    totalPool: 8000000000000000
  },
  MEEP: {
    assetId: 1234567, // Replace with actual MEEP asset ID
    rewardRate: 100000, // 100K tokens per 1 USDC
    totalPool: 1000000000000
  }
};

async function fetchUserTransactions(address, lastProcessedTime) {
  try {
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
          amount: tx['asset-transfer-transaction'].amount / 1000000,
          timestamp: new Date(tx['round-time'] * 1000),
          txId: tx.id
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
              amount: innerTx['asset-transfer-transaction'].amount / 1000000,
              timestamp: new Date(tx['round-time'] * 1000),
              txId: tx.id,
              isInnerTx: true
            });
          }
        }
      }
    }

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
    return data.assets.map(asset => asset['asset-id']);
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
    const pythonProcess = spawn('python', [
      path.join(__dirname, 'token_distribution.py')
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

    pythonProcess.stdin.write(JSON.stringify(data));
    pythonProcess.stdin.end();

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Distribution failed: ${error}`));
      } else {
        try {
          const response = JSON.parse(result);
          resolve(response.tx_ids);
        } catch (e) {
          reject(new Error('Failed to parse Python script response'));
        }
      }
    });
  });
}

async function updateStats(rewards) {
  const stats = await Statistics.findOne({ type: 'reward_pool' }) || new Statistics({ type: 'reward_pool' });
  
  for (const reward of rewards) {
    if (reward.token === 'SOCIALS') {
      stats.socials_distributed = (stats.socials_distributed || 0) + reward.amount;
    } else if (reward.token === 'MEEP') {
      stats.meep_distributed = (stats.meep_distributed || 0) + reward.amount;
    }
  }
  
  await stats.save();
}

async function processUserRewards(user) {
  try {
    const lastProcessedTime = user.lastProcessedTimestamp || new Date(0);
    const transactions = await fetchUserTransactions(user.immersveAddress, lastProcessedTime);
    
    if (transactions.length === 0) {
      return;
    }

    const optedInAssets = await getUserOptedInAssets(user.immersveRewardAddress);
    
    for (const transaction of transactions) {
      // Calculate rewards for all pools user is opted into
      const rewards = await processRewards(transaction, optedInAssets);
      
      if (rewards.length > 0) {
        // Distribute rewards using Python script
        const rewardTxIds = await distributeRewards(user.immersveRewardAddress, transaction, rewards);
        
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
        await updateStats(rewards);
      }
    }

    // Update last processed timestamp
    user.lastProcessedTimestamp = new Date();
    await user.save();
    
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

function initializeRewardProcessor() {
  // Run every 30 minutes
  const job = schedule.scheduleJob('*/30 * * * *', runRewardProcessor);
  
  console.log('Reward processor initialized - will run every 30 minutes');
  console.log('Next scheduled run:', job.nextInvocation().toString());
}

module.exports = {
  runRewardProcessor,
  initializeRewardProcessor
};