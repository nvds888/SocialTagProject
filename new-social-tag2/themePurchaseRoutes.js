const express = require('express');
const router = express.Router();
const peraWalletService = require('./perawalletservice');
const User = require('./modelsUser');

router.post('/purchase', async (req, res) => {
  try {
    const { themeName, userAddress } = req.body;

    console.log('Received purchase request');
    console.log('Theme:', themeName);
    console.log('User Address:', userAddress);

    if (!userAddress || typeof userAddress !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid user wallet address is required' });
    }

    if (!themeName || typeof themeName !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid theme name is required' });
    }

    // Use the minter address from .env as the receiver
    const receiverAddress = process.env.MINTER_ADDRESS;

    // Create unsigned USDC payment transaction
    const unsignedTxn = await peraWalletService.createUSDCPaymentTransaction(
      userAddress,
      receiverAddress,
      1 // 1 USDC
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

router.post('/confirm', async (req, res) => {
  try {
    const { signedTxn, themeName } = req.body;
    const userId = req.user.id; // Assuming you have user authentication middleware

    if (!signedTxn || typeof signedTxn !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid signed transaction is required' });
    }

    if (!themeName || typeof themeName !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid theme name is required' });
    }

    // Submit the signed transaction
    const txId = await peraWalletService.submitSignedTransaction(signedTxn);

    // Update user's purchased items
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { purchasedItems: themeName } },
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