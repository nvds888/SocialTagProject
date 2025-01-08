from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod, indexer
import json
import sys
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize clients
def init_clients():
    algod_address = "https://mainnet-api.algonode.cloud"
    algod_token = ""
    indexer_address = "https://mainnet-idx.algonode.cloud"
    indexer_token = ""
    
    algod_client = algod.AlgodClient(algod_token, algod_address)
    indexer_client = indexer.IndexerClient(indexer_token, indexer_address)
    
    return algod_client, indexer_client

# Asset constants
ASSETS = {
    'SOCIALS': {
        'id': 2607097066,
        'decimals': 6,
        'reward_rate': 1000000  # 1M per USDC
    },
    'MEEP': {
        'id': 1234567,  # Replace with actual MEEP asset ID
        'decimals': 6,
        'reward_rate': 100000  # 100K per USDC
    }
}

def create_asset_transfer(algod_client, sender, receiver, amount, asset_id):
    params = algod_client.suggested_params()
    
    unsigned_txn = transaction.AssetTransferTxn(
        sender=sender,
        sp=params,
        receiver=receiver,
        amt=amount,
        index=asset_id
    )
    
    return unsigned_txn

def send_rewards(transaction_data):
    """
    Sends rewards for a single transaction
    
    transaction_data format:
    {
        'receiver': str,  # Reward address
        'usdc_amount': float,  # Original USDC payment amount
        'opted_in_assets': list,  # List of asset IDs user is opted into
        'rewards': [  # List of rewards to send
            {
                'asset_id': int,
                'amount': int
            }
        ]
    }
    """
    try:
        algod_client, _ = init_clients()
        
        # Get mnemonic from environment
        mnemonic_phrase = os.getenv('REWARD_WALLET_MNEMONIC')
        if not mnemonic_phrase:
            raise ValueError("Mnemonic not found in environment")
        
        private_key = mnemonic.to_private_key(mnemonic_phrase)
        sender = account.address_from_private_key(private_key)
        
        # Create transactions for each reward
        signed_transactions = []
        for reward in transaction_data['rewards']:
            if reward['asset_id'] in transaction_data['opted_in_assets']:
                txn = create_asset_transfer(
                    algod_client,
                    sender,
                    transaction_data['receiver'],
                    reward['amount'],
                    reward['asset_id']
                )
                signed_txn = txn.sign(private_key)
                signed_transactions.append(signed_txn)
        
        # Submit transactions
        tx_ids = []
        for signed_txn in signed_transactions:
            try:
                tx_id = algod_client.send_transaction(signed_txn)
                algod_client.status_after_block(algod_client.status().get('last-round', 0) + 5)
                tx_ids.append(tx_id)
            except Exception as e:
                print(f"Error sending transaction: {str(e)}")
                continue
        
        return tx_ids
    
    except Exception as e:
        print(f"Error in send_rewards: {str(e)}")
        return None

if __name__ == "__main__":
    print("Python script starting", file=sys.stderr)
    # Read transaction data from stdin
    try:
        stdin_data = sys.stdin.read()
        print(f"Received stdin data: {stdin_data}", file=sys.stderr)
        
        transaction_data = json.loads(stdin_data)
        print(f"Parsed transaction data: {json.dumps(transaction_data, indent=2)}", file=sys.stderr)
        
        tx_ids = send_rewards(transaction_data)
        print(f"Generated tx_ids: {tx_ids}", file=sys.stderr)
        
        response = {"success": bool(tx_ids), "tx_ids": tx_ids}
        print(f"Sending response: {json.dumps(response)}", file=sys.stderr)
        print(json.dumps(response))  # This is the actual response
        
    except Exception as e:
        print(f"Error in main: {str(e)}", file=sys.stderr)
        error_response = {"success": False, "error": str(e)}
        print(json.dumps(error_response))  # This is the actual response