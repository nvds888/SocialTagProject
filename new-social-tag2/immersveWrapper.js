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
  }
};

async function fetchUserTransactions(address, lastProcessedTime) {
  const now = new Date();
  const thirtyMinutesAgo = new Date(now - 30 * 60 * 1000);
  
  console.log('Checking transactions for address:', address);
  console.log('Last processed time:', lastProcessedTime);
  console.log('Thirty minutes ago:', thirtyMinutesAgo);
  console.log('Should generate test transactions:', lastProcessedTime < thirtyMinutesAgo);
  
  // Only return test transactions if the lastProcessedTime is within our 30-minute window
  if (lastProcessedTime < thirtyMinutesAgo) {
    console.log('Generating test transactions for address:', address);
    
    // Create two test transactions
    const testTransactions = [
      {
        amount: 5, // 5 USDC
        timestamp: new Date(now - 20 * 60 * 1000), // 20 minutes ago
        txId: `test_tx_5usdc_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        isInnerTx: false
      },
      {
        amount: 2, // 2 USDC
        timestamp: new Date(now - 10 * 60 * 1000), // 10 minutes ago
        txId: `test_tx_2usdc_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        isInnerTx: false
      }
    ];

    console.log('Generated test transactions:', testTransactions);
    return testTransactions;
  }

  return []; // Return empty array if we've already processed these test transactions
}

// Rest of the functions remain exactly the same
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

// Keep the rest of the file exactly the same
async function distributeRewards(rewardAddress, transaction, rewards) {
  return new Promise((resolve, reject) => {
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
        await updateStats(rewards);
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

// Run every 30 minutes
const job = schedule.scheduleJob('*/30 * * * *', runRewardProcessor);

console.log('Reward processor initialized - will run every 30 minutes');
console.log('Next scheduled run:', job.nextInvocation().toString());

module.exports = {
  runRewardProcessor,
  initializeRewardProcessor: () => {} // Empty function since we're running directly
};