const express = require('express');
const router = express.Router();
const User = require('./modelsUser');
const { v4: uuidv4 } = require('uuid');
const { createVerificationTransaction } = require('./combinedBlockchainService');
const multer = require('multer');
const path = require('path');
const peraWalletService = require('./perawalletservice');
const OptInWallet = require('./modelsOptInWallet');
const { AlgorandNFTViewer } = require('@gradian/arcviewer');
const algosdk = require('algosdk');


// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

const sessionCheck = (req, res, next) => {
  console.log('Session check middleware:');
  console.log('Session:', req.session);
  console.log('Is Authenticated:', req.isAuthenticated());
  console.log('User:', req.user);
  
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      error: 'Not authenticated',
      session: !!req.session,
      hasUser: !!req.user
    });
  }
  next();
};

const initAlgorandClient = () => {
  const server = process.env.ALGOD_SERVER || 'https://mainnet-api.algonode.cloud';
  const port = process.env.ALGOD_PORT || '';
  const token = process.env.ALGOD_TOKEN || '';
  
  return new algosdk.Algodv2(token, server, port);
};

// Updated function to calculate reward points
const calculateRewardPoints = (profileViews, purchasedItems, verifications, profileNFT, nfd, reverifyCount, baseVerifyPoints) => {
  const viewPoints = profileViews * 5;
  const purchasePoints = (purchasedItems?.length || 0) * 50;
  const nftPoints = profileNFT && profileNFT.id ? 75 : 0;
  const nfdPoints = nfd && nfd.id ? 75 : 0;
  
  let verificationPoints = 0;
  if (verifications && verifications.length > 0) {
    verificationPoints += 100;
    const latestVerification = verifications[verifications.length - 1];
    const connectedAccounts = ['twitter', 'facebook', 'spotify', 'github', 'linkedin'];
    connectedAccounts.forEach(account => {
      if (latestVerification[account]) {
        verificationPoints += 50;
      }
    });
  }
  
  const totalPoints = viewPoints + purchasePoints + verificationPoints + nftPoints + nfdPoints + baseVerifyPoints;
  const reverifyDeduction = reverifyCount * 500;
  
  return Math.max(totalPoints - reverifyDeduction, 0);
};

router.get('/user', sessionCheck, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const { twitter, facebook, linkedin, github, spotify, verifications, theme, bio, profileNFT, purchasedItems, profileViews, reverifyCount, baseVerifyPoints, nfd } = req.user;

  const latestVerification = verifications && verifications.length > 0 ? verifications[verifications.length - 1] : null;

  const rewardPoints = calculateRewardPoints(profileViews, purchasedItems, verifications, profileNFT, req.user.nfd, reverifyCount, baseVerifyPoints);

  res.json({
    twitter: twitter ? { username: twitter.username } : null,
    facebook: facebook ? { name: facebook.name } : null,
    linkedin: linkedin ? { name: linkedin.name } : null,
    github: github ? { username: github.username } : null,
    spotify: spotify ? { id: spotify.id, username: spotify.username } : null,
    verifications: verifications || [],
    theme,
    bio,
    profileNFT,
    nfd,
    purchasedItems: purchasedItems || [],
    profileViews: profileViews || 0,
    rewardPoints,
    verificationLink: latestVerification ? latestVerification.verificationLink : null,
    algorandTransactionId: latestVerification ? latestVerification.algorandTransactionId : null,
    stellarTransactionHash: latestVerification ? latestVerification.stellarTransactionHash : null,
    reverifyCount: req.user.reverifyCount || 0,
  });
});

router.get('/user/reward-points', sessionCheck, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const rewardPoints = calculateRewardPoints(user.profileViews, user.purchasedItems, user.verifications, user.profileNFT, user.nfd, user.reverifyCount, user.baseVerifyPoints);
    
    res.json({ rewardPoints });
  } catch (error) {
    console.error('Error fetching reward points:', error);
    res.status(500).json({ error: 'Failed to fetch reward points', details: error.message });
  }
});

router.get('/social-balance', async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  try {
    const response = await fetch(
      `https://mainnet-idx.4160.nodely.dev/v1/indexer/account/${address}?assetId=2607097066`
    );

    const data = await response.json();
    let balance = '0';

    if (data?.accountData?.assets?.length > 0) {
      const socialAsset = data.accountData.assets.find(
        (asset) => asset.assetId === 2607097066
      );
      if (socialAsset) {
        balance = (socialAsset.amount / 1000000).toFixed(2);
      }
    }

    res.status(200).json({ balance });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

router.post('/user/wallet-settings', sessionCheck, async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { saveWalletAddress, walletAddress } = req.body;
    
    // First, get the user's current wallet address before updating
    const currentUser = await User.findById(req.user._id);
    const previousWalletAddress = currentUser.walletAddress;
    
    // Update user model
    const updateData = {
      saveWalletAddress,
      walletAddress: saveWalletAddress ? walletAddress : null
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Handle OptInWallet collection based on changes in User model
    if (previousWalletAddress) {
      // Remove old wallet address from OptInWallet
      await OptInWallet.findOneAndDelete({ walletAddress: previousWalletAddress });
    }

    // Add new wallet address to OptInWallet if saving
    if (saveWalletAddress && walletAddress) {
      await OptInWallet.findOneAndUpdate(
        { walletAddress },
        { walletAddress },
        { upsert: true, new: true }
      );
    }

    res.json({
      saveWalletAddress: updatedUser.saveWalletAddress,
      walletAddress: updatedUser.walletAddress
    });
  } catch (error) {
    console.error('Error updating wallet settings:', error);
    res.status(500).json({ error: 'Failed to update wallet settings' });
  }
});

router.post('/verify', sessionCheck, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await User.findById(req.user.id);
    
    const connectedAccounts = [user.twitter, user.facebook, user.linkedin, user.github, user.spotify].filter(Boolean).length;
    if (connectedAccounts < 2) {
      return res.status(400).json({ error: 'At least two social accounts must be connected to verify' });
    }

    const verificationData = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      twitter: user.twitter ? user.twitter.username : null,
      facebook: user.facebook ? user.facebook.name : null,
      linkedin: user.linkedin ? user.linkedin.name : null,
      github: user.github ? user.github.username : null,
      spotify: user.spotify ? user.spotify.username : null
    };

    const { stellar: stellarTransactionHash, algorand: algorandTransactionId } = 
      await createVerificationTransaction(verificationData);

    user.verifications.push({
      ...verificationData,
      algorandTransactionId,
      stellarTransactionHash
    });

    await user.save();
    
    const rewardPoints = calculateRewardPoints(user.profileViews, user.purchasedItems, user.verifications, user.profileNFT, user.nfd, user.reverifyCount, user.baseVerifyPoints);

    res.json({
      message: 'Verification successful',
      verificationId: verificationData.id,
      algorandTransactionId,
      stellarTransactionHash,
      rewardPoints
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Internal server error during verification' });
  }
});

router.post('/fetch-nft-metadata', sessionCheck, async (req, res) => {
  const { assetIds } = req.body;

  if (!Array.isArray(assetIds)) {
    return res.status(400).json({ error: 'assetIds must be an array' });
  }

  try {
    const algodClient = initAlgorandClient();
    const nftViewer = new AlgorandNFTViewer(algodClient);
    
    const metadataPromises = assetIds.map(async (assetId) => {
      try {
        const assetMetadata = await nftViewer.getNFTAssetData(Number(assetId), true);
        
        let imageUrl = assetMetadata.arcMetadata.httpsImageUrl;
        if (!imageUrl && assetMetadata.arcMetadata.image) {
          // Construct IPFS URL if not provided as HTTPS
          const ipfsHash = assetMetadata.arcMetadata.image.replace('ipfs://', '');
          imageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
        }

        return {
          id: assetId.toString(),
          metadata: assetMetadata.arcMetadata,
          imageUrl,
          name: assetMetadata.params.name || `Asset #${assetId}`,
          unitName: assetMetadata.params.unitName || '',
        };
      } catch (error) {
        console.error(`Error fetching metadata for asset ${assetId}:`, error);
        return null;
      }
    });

    const metadata = (await Promise.all(metadataPromises)).filter(Boolean);
    return res.status(200).json(metadata);
  } catch (error) {
    console.error('Error processing NFT metadata:', error);
    return res.status(500).json({ error: 'Failed to fetch NFT metadata' });
  }
});

router.post('/re-verify', sessionCheck, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await User.findById(req.user.id);
    
    const currentPoints = calculateRewardPoints(user.profileViews, user.purchasedItems, user.verifications, user.profileNFT, user.nfd, user.reverifyCount, user.baseVerifyPoints);
    
    if (currentPoints < 500) {
      return res.status(400).json({ success: false, message: 'Insufficient reward points. 500 points required for re-verification.' });
    }

    // Calculate baseVerifyPoints before clearing verifications
    let baseVerifyPoints = 100; // Base points for verification
    if (user.verifications && user.verifications.length > 0) {
      const latestVerification = user.verifications[user.verifications.length - 1];
      const connectedAccounts = ['twitter', 'facebook', 'spotify', 'github', 'linkedin'];
      connectedAccounts.forEach(account => {
        if (latestVerification[account]) {
          baseVerifyPoints += 25;
        }
      });
    }
    user.baseVerifyPoints = baseVerifyPoints;

    // Increment the re-verify count
    user.reverifyCount += 1;

    // Clear all verifications
    user.verifications = [];

    // Disconnect all social accounts except Twitter
    user.facebook = null;
    user.linkedin = null;
    user.github = null;
    user.spotify = null;

    await user.save();

    const updatedPoints = calculateRewardPoints(user.profileViews, user.purchasedItems, user.verifications, user.profileNFT, user.nfd, user.reverifyCount, user.baseVerifyPoints);
    
    res.json({
      success: true,
      message: 'Re-verification process initiated successfully',
      updatedRewardPoints: updatedPoints
    });
  } catch (error) {
    console.error('Re-verification error:', error);
    res.status(500).json({ success: false, error: 'Internal server error during re-verification' });
  }
});

router.get('/user/:username', sessionCheck, async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ 
      $or: [
        { 'twitter.username': username },
        { username: username }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { twitter, facebook, linkedin, github, spotify, verifications, theme, bio, profileNFT, purchasedItems, profileViews, reverifyCount, baseVerifyPoints, nfd } = user;

    const latestVerification = verifications && verifications.length > 0 ? verifications[verifications.length - 1] : null;

    const rewardPoints = calculateRewardPoints(profileViews, purchasedItems, verifications, profileNFT, user.nfd, reverifyCount, baseVerifyPoints);

    res.json({
      twitter: twitter ? { username: twitter.username } : null,
      facebook: facebook ? { name: facebook.name } : null,
      linkedin: linkedin ? { name: linkedin.name } : null,
      github: github ? { username: github.username } : null,
      spotify: spotify ? { id: spotify.id, username: spotify.username } : null,
      verifications: verifications || [],
      theme,
      bio,
      profileNFT,
      nfd,
      purchasedItems: purchasedItems || [],
      profileViews: profileViews || 0,
      rewardPoints,
      verificationLink: latestVerification ? latestVerification.verificationLink : null,
      algorandTransactionId: latestVerification ? latestVerification.algorandTransactionId : null,
      stellarTransactionHash: latestVerification ? latestVerification.stellarTransactionHash : null,
      reverifyCount: user.reverifyCount || 0,
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/explore', async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const user = await User.findOne({
      $or: [
        { 'twitter.username': username },
        { 'facebook.name': username },
        { 'linkedin.name': username },
        { 'github.username': username }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const latestVerification = user.verifications[user.verifications.length - 1];

    res.json({
      twitter: user.twitter ? user.twitter.username : 'Not connected',
      facebook: user.facebook ? user.facebook.name : 'Not connected',
      linkedin: user.linkedin ? user.linkedin.name : 'Not connected',
      github: user.github ? user.github.username : 'Not connected',
      stellarVerificationHash: latestVerification ? latestVerification.stellarTransactionHash : 'Not verified',
      algorandVerificationId: latestVerification ? latestVerification.algorandTransactionId : 'Not verified',
      theme: user.theme,
      bio: user.bio || '',
      profileImage: user.profileImage || ''
    });
  } catch (error) {
    console.error('Error in explore endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/user', sessionCheck, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    await User.findByIdAndDelete(req.user.id);
    req.logout((err) => {
      if (err) {
        console.error('Error logging out user:', err);
        return res.status(500).json({ error: 'Error logging out user' });
      }
      res.json({ message: 'User data deleted successfully' });
    });
  } catch (error) {
    console.error('Error deleting user data:', error);
    res.status(500).json({ error: 'Internal server error while deleting user data' });
  }
});

router.post('/increment-view/:username', async (req, res) => {
  try {
    console.log('Processing view increment for username:', req.params.username);
    
    // Get the user's IP address
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log('Client IP:', clientIP);
    
    // Find the user
    const user = await User.findOne({ 'twitter.username': req.params.username });
    
    if (!user) {
      console.log('User not found:', req.params.username);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if this IP has viewed within the last 6 hours
    const sixHoursAgo = new Date(Date.now() - (6 * 60 * 60 * 1000));
    
    // Initialize viewHistory if it doesn't exist
    if (!user.viewHistory) {
      user.viewHistory = [];
    }

    // Clean up old view history entries
    user.viewHistory = user.viewHistory.filter(view => 
      new Date(view.timestamp) > sixHoursAgo
    );

    // Check if this IP has viewed recently
    const hasRecentView = user.viewHistory.some(view => 
      view.ip === clientIP && new Date(view.timestamp) > sixHoursAgo
    );

    if (!hasRecentView) {
      console.log('Recording new view for IP:', clientIP);
      // Add new view record
      user.viewHistory.push({
        ip: clientIP,
        timestamp: new Date()
      });

      // Increment view count
      user.profileViews = (user.profileViews || 0) + 1;
      
      await user.save();
      console.log('Updated view count:', user.profileViews);
    } else {
      console.log('Recent view found for IP:', clientIP);
    }

    const rewardPoints = calculateRewardPoints(
      user.profileViews,
      user.purchasedItems, 
      user.verifications, 
      user.profileNFT, 
      user.nfd, 
      user.reverifyCount, 
      user.baseVerifyPoints
    );

    res.json({ 
      views: user.profileViews, 
      rewardPoints,
      message: hasRecentView ? 'View already counted' : 'View counted successfully'
    });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/update-hardcoded-status', sessionCheck, async (req, res) => {
  try {
    const { isHardcoded, assetConfigurationTxId } = req.body;
    console.log('Updating hardcoded status:', { isHardcoded, assetConfigurationTxId });
    
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: { 
          isDataHardcoded: isHardcoded,
          assetConfigurationTxId: assetConfigurationTxId
        },
        $push: {
          verifications: {
            timestamp: new Date(),
            algorandTransactionId: assetConfigurationTxId,
            isPermanentafy: true
          }
        }
      },
      { new: true }
    );

    console.log('Updated user:', updatedUser);

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Hardcoded status updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating hardcoded status:', error);
    res.status(500).json({ error: 'Failed to update hardcoded status' });
  }
});

router.post('/user/settings', sessionCheck, async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { theme, cardStyle, bio, profileNFT, nfd } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        theme,
        cardStyle,
        bio,
        profileNFT,
        nfd: nfd ? {
          id: nfd.id,
          name: nfd.name,
          assetId: nfd.assetId
        } : null
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const rewardPoints = calculateRewardPoints(updatedUser.profileViews, updatedUser.purchasedItems, updatedUser.verifications, updatedUser.profileNFT, updatedUser.nfd, updatedUser.reverifyCount, updatedUser.baseVerifyPoints);

    res.json({
      theme: updatedUser.theme,
      cardStyle: updatedUser.cardStyle,
      bio: updatedUser.bio,
      profileNFT: updatedUser.profileNFT,
      nfd: updatedUser.nfd,
      rewardPoints
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

router.get('/public-profile/:username', async (req, res) => {
  try {
    console.log('Fetching public profile for username:', req.params.username);
    const user = await User.findOne({ 'twitter.username': req.params.username });
    if (!user) {
      console.log('User not found:', req.params.username);
      return res.status(404).json({ message: 'User not found' });
    }

    const latestVerification = user.verifications && user.verifications.length > 0
      ? user.verifications[user.verifications.length - 1]
      : null;

    const rewardPoints = calculateRewardPoints(user.profileViews, user.purchasedItems, user.verifications, user.profileNFT, user.nfd, user.reverifyCount, user.baseVerifyPoints);

    const publicProfile = {
      username: user.username,
      twitter: user.twitter ? { username: user.twitter.username } : null,
      facebook: user.facebook ? { name: user.facebook.name } : null,
      linkedin: user.linkedin ? { name: user.linkedin.name } : null,
      github: user.github ? { username: user.github.username } : null,
      spotify: user.spotify ? { username: user.spotify.username } : null,
      theme: user.theme,
      cardStyle: user.cardStyle,
      bio: user.bio,
      profileImage: user.profileImage,
      profileNFT: user.profileNFT,
      profileViews: user.profileViews,
      algorandTransactionId: latestVerification ? latestVerification.algorandTransactionId : null,
      isVerified: !!latestVerification,
      reverifyCount: user.reverifyCount || 0,
      rewardPoints: rewardPoints,
      nfd: user.nfd ? {
        id: user.nfd.id,
        name: user.nfd.name,
        assetId: user.nfd.assetId
      } : null
    };
    console.log('Returning public profile:', publicProfile);
    res.json(publicProfile);
  } catch (error) {
    console.error('Error fetching public profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    // Only fetch users who have at least one verification
    const users = await User.find(
      { 'verifications.0': { $exists: true } }, // This checks if there's at least one element in verifications array
      'twitter.username nfd profileViews purchasedItems verifications profileNFT reverifyCount baseVerifyPoints'
    );
    
    const leaderboardData = users.map(user => ({
      twitterUsername: user.twitter?.username || 'Unknown',
      nfdName: user.nfd?.name || null,
      rewardPoints: calculateRewardPoints(
        user.profileViews, 
        user.purchasedItems, 
        user.verifications, 
        user.profileNFT, 
        user.nfd, 
        user.reverifyCount, 
        user.baseVerifyPoints
      ),
      verified: true, // Adding this field for clarity in the frontend
      lastVerified: user.verifications[user.verifications.length - 1].timestamp
    }));

    // Sort the leaderboard data by reward points in descending order
    leaderboardData.sort((a, b) => b.rewardPoints - a.rewardPoints);

    res.json(leaderboardData);
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/theme/purchase', sessionCheck, async (req, res) => {
  try {
    const { themeName, userAddress, paymentType = 'USDC' } = req.body;

    console.log('Received purchase request');
    console.log('Theme:', themeName);
    console.log('User Address:', userAddress);
    console.log('Payment Type:', paymentType);

    if (!userAddress || typeof userAddress !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid user wallet address is required' });
    }

    if (!themeName || typeof themeName !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid theme name is required' });
    }

    const receiverAddress = process.env.MINTER_ADDRESS;

    // Select the correct asset ID and amount based on payment type
    const assetId = paymentType === 'USDC' ? peraWalletService.USDC_ASSET_ID : peraWalletService.ORA_ASSET_ID;
    const amount = paymentType === 'USDC' ? 1 : 1000;  // 1 USDC or 10 ORA

    // Create unsigned payment transaction
    const unsignedTxn = await peraWalletService.createAssetPaymentTransaction(
      userAddress,
      receiverAddress,
      amount,
      assetId
    );

    res.json({ 
      success: true, 
      message: 'Unsigned transaction created successfully', 
      unsignedTxn,
      themeName
    });

  } catch (error) {
    console.error('Error creating theme purchase transaction:', error);
    res.status(500).json({ success: false, message: 'Failed to create theme purchase transaction', error: error.message });
  }
});


router.post('/theme/confirm', sessionCheck, async (req, res) => {
  try {
    const { signedTxn, themeName, paymentType } = req.body;
    const userId = req.user.id;

    if (!signedTxn || typeof signedTxn !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid signed transaction is required' });
    }

    if (!themeName || typeof themeName !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid theme name is required' });
    }

    // Submit the signed transaction
    const txId = await peraWalletService.submitSignedTransaction(signedTxn);

    // Update user's purchased items and purchase history
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        $addToSet: { 
          purchasedItems: themeName,
          purchaseHistory: {
            item: themeName,
            paymentType,
            txId,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    if (user) {
      res.json({ success: true, message: 'Theme purchased successfully', txId });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Error confirming theme purchase:', error);
    res.status(500).json({ success: false, message: 'Failed to confirm theme purchase', error: error.message });
  }
});

module.exports = router;