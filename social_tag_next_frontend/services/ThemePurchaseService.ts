import axios from 'axios';
import algosdk from 'algosdk';
import { PeraWalletConnect } from '@perawallet/connect';

const peraWallet = new PeraWalletConnect();

const PAYMENT_TYPES = {
  USDC: 'USDC',
  SOCIALS: 'SOCIALS'
} as const;

type PaymentType = typeof PAYMENT_TYPES[keyof typeof PAYMENT_TYPES];

export const ThemePurchaseService = {
  async purchaseTheme(
    themeName: string, 
    paymentType: PaymentType
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // Check if the wallet is connected
      let accounts: string[] = [];
      try {
        accounts = await peraWallet.reconnectSession();
      } catch (error) {
        // If not connected, trigger the connection
        accounts = await peraWallet.connect();
      }

      if (accounts.length === 0) {
        return { success: false, message: 'Failed to connect to Pera Wallet' };
      }

      const userAddress = accounts[0];

      // Request the unsigned transaction from the backend
      const response = await axios.post('/api/theme/purchase', {
        themeName,
        userAddress,
        paymentType
      }, { withCredentials: true });
      
      const { unsignedTxn, themeName: confirmedThemeName } = response.data;

      console.log('Received unsigned transaction:', unsignedTxn);

      // Decode the transaction
      let decodedTxn;
      try {
        const binaryUnsignedTxn = new Uint8Array(Buffer.from(unsignedTxn, 'base64'));
        decodedTxn = algosdk.decodeUnsignedTransaction(binaryUnsignedTxn);
        console.log('Decoded transaction:', decodedTxn);
      } catch (error) {
        console.error('Error decoding transaction:', error);
        return { success: false, message: 'Failed to decode transaction' };
      }

      if (!decodedTxn) {
        console.error('Decoded transaction is undefined');
        return { success: false, message: 'Failed to decode transaction' };
      }

      // Sign the transaction with Pera Wallet
      let signedTxns;
      try {
        signedTxns = await peraWallet.signTransaction([[{ txn: decodedTxn }]]);
        console.log('Signed transactions:', signedTxns);
      } catch (error) {
        console.error('Error signing transaction:', error);
        return { success: false, message: 'Failed to sign transaction' };
      }

      if (!signedTxns || signedTxns.length === 0) {
        console.error('No signed transactions received');
        return { success: false, message: 'No signed transactions received' };
      }

      // Send the signed transaction back to the backend for confirmation
      const confirmResponse = await axios.post('/api/theme/confirm', {
        signedTxn: Buffer.from(signedTxns[0]).toString('base64'),
        themeName: confirmedThemeName,
        paymentType
      }, { withCredentials: true });

      return confirmResponse.data;
    } catch (error) {
      console.error('Error purchasing theme:', error);
      return { success: false, message: 'An error occurred while purchasing the theme' };
    }
  },
};