const express = require('express');
const router = express.Router();
const peraWalletService = require('./perawalletservice');
const User = require('./modelsUser');

const sessionCheck = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      error: 'Not authenticated',
      session: !!req.session,
      hasUser: !!req.user
    });
  }
  next();
};

router.post('/purchase', sessionCheck, async (req, res) => {
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

    if (!['USDC', 'ORA', 'SOCIALS'].includes(paymentType)) {
      return res.status(400).json({ success: false, message: 'Invalid payment type' });
    }

    const receiverAddress = process.env.MINTER_ADDRESS;
    let assetId, amount;

    // Explicitly handle each asset type
    if (paymentType === 'USDC') {
      console.log('Processing USDC payment');
      assetId = peraWalletService.USDC_ASSET_ID;
      amount = 1;
    } 
    else if (paymentType === 'ORA') {
      console.log('Processing ORA payment');
      assetId = peraWalletService.ORA_ASSET_ID;
      amount = 1000;
    }
    else if (paymentType === 'SOCIALS') {
      console.log('Processing SOCIALS payment');
      assetId = peraWalletService.SOCIALS_ASSET_ID;
      amount = 100000000;
    }
    else {
      return res.status(400).json({ success: false, message: 'Invalid payment type' });
    }

    console.log('Selected Asset Configuration:');
    console.log('Asset ID:', assetId);
    console.log('Amount:', amount);

    // Create unsigned payment transaction
    const unsignedTxn = await peraWalletService.createAssetPaymentTransaction(
      userAddress,
      receiverAddress,
      amount,
      assetId,
      paymentType  // Pass the payment type to the service
    );

    res.json({ 
      success: true, 
      message: 'Unsigned transaction created successfully', 
      unsignedTxn,
      themeName,
      debug: { assetId, amount, paymentType }
    });

  } catch (error) {
    console.error('Error creating theme purchase transaction:', error);
    res.status(500).json({ success: false, message: 'Failed to create theme purchase transaction', error: error.message });
  }
});

router.post('/confirm', sessionCheck, async (req, res) => {
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