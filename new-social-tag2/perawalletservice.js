const algosdk = require('algosdk');

// Replace with your Algorand node details
const algodClient = new algosdk.Algodv2('', 'https://mainnet-api.4160.nodely.dev/', '');

// Replace with your account details
const MINTER_ACCOUNT = {
  addr: process.env.MINTER_ADDRESS,
  sk: algosdk.mnemonicToSecretKey(process.env.MINTER_MNEMONIC).sk
};

const USDC_ASSET_ID = 31566704; // Replace with actual USDC ASA ID

async function createASA(username, verifiedAccounts, profileUrl) {
  try {
    console.log('Creating ASA...');
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create an ASA (Algorand Standard Asset) to represent the permanentafied data
    const asaCreateTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      from: MINTER_ACCOUNT.addr,
      total: 1,
      decimals: 0,
      assetName: `ST${username}`,
      unitName: "STNFT",
      assetURL: profileUrl,
      manager: MINTER_ACCOUNT.addr,
      reserve: MINTER_ACCOUNT.addr,
      freeze: MINTER_ACCOUNT.addr,
      clawback: MINTER_ACCOUNT.addr,
      suggestedParams,
      note: new TextEncoder().encode(`Verified accounts: ${verifiedAccounts}`),
    });

    // Sign and submit the ASA creation transaction
    const signedAsaCreateTxn = algosdk.signTransaction(asaCreateTxn, MINTER_ACCOUNT.sk);
    const asaCreateTxnResponse = await algodClient.sendRawTransaction(signedAsaCreateTxn.blob).do();
    console.log('ASA creation transaction submitted:', asaCreateTxnResponse.txId);
    const asaCreateConfirmation = await algosdk.waitForConfirmation(algodClient, asaCreateTxnResponse.txId, 4);
    const assetId = asaCreateConfirmation['asset-index'];
    console.log('ASA created with ID:', assetId);

    return { assetId, txId: asaCreateTxnResponse.txId };
  } catch (error) {
    console.error('Error creating ASA:', error);
    throw error;
  }
}

async function createClaimASATransactions(receiverAddress, assetId) {
  try {
    console.log('Creating claim ASA transactions...');
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create opt-in transaction for the receiver
    const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: receiverAddress,
      to: receiverAddress,
      amount: 0,
      assetIndex: assetId,
      suggestedParams,
    });

    // Create transfer transaction
    const transferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: MINTER_ACCOUNT.addr,
      to: receiverAddress,
      amount: 1,
      assetIndex: assetId,
      suggestedParams,
    });

    // Group the opt-in and transfer transactions
    const txns = [optInTxn, transferTxn];
    const groupID = algosdk.computeGroupID(txns);
    for (let i = 0; i < 2; i++) txns[i].group = groupID;

    // Encode the transactions
    const encodedTxns = txns.map(txn => Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString('base64'));

    console.log('Claim ASA transactions created successfully');
    encodedTxns.forEach((txn, index) => {
      console.log(`Encoded transaction ${index}:`, txn.substring(0, 50) + '...');
    });

    return { txnGroup: encodedTxns };
  } catch (error) {
    console.error('Error creating claim ASA transactions:', error);
    throw error;
  }
}

async function fetchWalletNFDs(address) {
  try {
    console.log(`Fetching NFDs for address: ${address}`);
    
    if (!address || typeof address !== 'string') {
      throw new Error('Invalid wallet address provided');
    }

    const indexerClient = new algosdk.Indexer('', 'https://mainnet-idx.4160.nodely.dev/', '');
    let nfds = [];
    let nextToken = null;

    do {
      console.log('Querying indexer for assets...');
      const response = await indexerClient.lookupAccountAssets(address).limit(100).nextToken(nextToken).do();
      console.log('Indexer response:', JSON.stringify(response, null, 2));
      
      const filteredAssets = response.assets.filter(asset => 
        asset.amount > 0 // Only consider assets with a positive balance
      );

      for (const asset of filteredAssets) {
        console.log(`Fetching info for asset ID: ${asset['asset-id']}`);
        try {
          const assetInfo = await algodClient.getAssetByID(asset['asset-id']).do();
          console.log('Asset info:', JSON.stringify(assetInfo, null, 2));
          
          // Check if the asset is an NFD
          if (assetInfo.params.name && assetInfo.params.name.endsWith('.algo')) {
            nfds.push({
              id: asset['asset-id'],
              name: assetInfo.params.name
            });
          }
        } catch (assetError) {
          console.error(`Error fetching info for asset ${asset['asset-id']}:`, assetError);
          // Continue with the next asset
        }
      }

      nextToken = response['next-token'];
    } while (nextToken);

    console.log(`Found ${nfds.length} NFDs for address ${address}`);
    return nfds;
  } catch (error) {
    console.error('Error in fetchWalletNFDs:', error);
    throw error;
  }
}

async function createUSDCPaymentTransaction(senderAddress, receiverAddress, amount) {
  try {
    console.log('Creating USDC payment transaction');
    console.log('Sender:', senderAddress);
    console.log('Receiver:', receiverAddress);
    console.log('Amount:', amount);

    if (!senderAddress || typeof senderAddress !== 'string') {
      throw new Error('Invalid senderAddress');
    }

    if (!receiverAddress || typeof receiverAddress !== 'string') {
      throw new Error('Invalid receiverAddress');
    }

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      throw new Error('Invalid amount');
    }

    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create the USDC transfer transaction
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: senderAddress,
      to: receiverAddress,
      amount: Math.floor(amount * 1000000), // Convert to 6 decimal places
      assetIndex: USDC_ASSET_ID,
      suggestedParams,
      note: new TextEncoder().encode("SocialTag"), //
    });

    // Encode the unsigned transaction
    const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
    return Buffer.from(encodedTxn).toString('base64');
  } catch (error) {
    console.error('Error creating USDC payment transaction:', error);
    throw error;
  }
}

async function submitSignedTransaction(signedTxn) {
  try {
    const decodedTxn = new Uint8Array(Buffer.from(signedTxn, 'base64'));
    const txResponse = await algodClient.sendRawTransaction(decodedTxn).do();
    await algosdk.waitForConfirmation(algodClient, txResponse.txId, 4);
    return txResponse.txId;
  } catch (error) {
    console.error('Error submitting signed transaction:', error);
    throw error;
  }
}

async function submitClaimTransactions(signedTxns) {
  try {
    const decodedTxns = signedTxns.map(txn => new Uint8Array(Buffer.from(txn, 'base64')));
    const txResponse = await algodClient.sendRawTransaction(decodedTxns).do();
    await algosdk.waitForConfirmation(algodClient, txResponse.txId, 4);
    return txResponse.txId;
  } catch (error) {
    console.error('Error submitting claim transactions:', error);
    throw error;
  }
}

async function fetchWalletNFTs(address) {
  try {
    console.log(`Fetching NFTs for address: ${address}`);
    
    if (!address || typeof address !== 'string') {
      throw new Error('Invalid wallet address provided');
    }

    const indexerClient = new algosdk.Indexer('', 'https://mainnet-idx.4160.nodely.dev/', '');
    let nfts = [];
    let nextToken = null;

    do {
      console.log('Querying indexer for assets...');
      const response = await indexerClient.lookupAccountAssets(address).limit(100).nextToken(nextToken).do();
      console.log('Indexer response:', JSON.stringify(response, null, 2));
      
      const filteredAssets = response.assets.filter(asset => 
        asset.amount > 0 // Only consider assets with a positive balance
      );

      for (const asset of filteredAssets) {
        console.log(`Fetching info for asset ID: ${asset['asset-id']}`);
        try {
          const assetInfo = await algodClient.getAssetByID(asset['asset-id']).do();
          console.log('Asset info:', JSON.stringify(assetInfo, null, 2));
          
          // Check if the asset meets NFT criteria
          if (assetInfo.params.total === 1 && assetInfo.params.decimals === 0 && assetInfo.params.url) {
            nfts.push({
              id: asset['asset-id'],
              name: assetInfo.params.name,
              unitName: assetInfo.params['unit-name'],
              url: assetInfo.params.url
            });
          }
        } catch (assetError) {
          console.error(`Error fetching info for asset ${asset['asset-id']}:`, assetError);
          // Continue with the next asset
        }
      }

      nextToken = response['next-token'];
    } while (nextToken);

    console.log(`Found ${nfts.length} NFTs for address ${address}`);
    return nfts;
  } catch (error) {
    console.error('Error in fetchWalletNFTs:', error);
    throw error;
  }
}

module.exports = {
  createASA,
  createClaimASATransactions,
  createUSDCPaymentTransaction,
  submitSignedTransaction,
  submitClaimTransactions,
  fetchWalletNFTs,
  fetchWalletNFDs
};