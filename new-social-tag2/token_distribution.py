import os
import sys
import json
from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk import transaction
from dotenv import load_dotenv
import pymongo
from datetime import datetime

# Load environment variables from .env file
load_dotenv()

# Load environment variables
ALGOD_ADDRESS = "https://mainnet-api.algonode.cloud"
ALGOD_TOKEN = ""  # Not required for AlgoNode
MNEMONIC = os.getenv("ALGORAND_MNEMONIC")
MONGO_URI = os.getenv("MONGODB_URI")
ASSET_ID = 2607097066  # Your token's asset ID

if not MNEMONIC:
    raise ValueError("ALGORAND_MNEMONIC environment variable is not set")

if not MONGO_URI:
    raise ValueError("MONGODB_URI environment variable is not set")

# Create Algod client
algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

# Get account from mnemonic
private_key = mnemonic.to_private_key(MNEMONIC)
address = account.address_from_private_key(private_key)

def get_wallet_addresses():
    """Fetch all wallet addresses from MongoDB"""
    return [
        "HT6ZYXQH7GRBTKD4WWAKLJNBXFES4B2WTRP5RXRBTGHSCPU23XOETGEKM4",
        "UFHFK4KCKMS5YQKH2ZG3VWX2Y4ZEUGVLVEHJYWXHIADA3DHX2O2XUOSIQM",
        "K3SFX5RTJNY23A6OTCY66OYVWP2UCEDAH34H6LSBPPHPOEJGAZIAS366BI",
        "HF6ZQ6HLKECNRFJDCUD6J2RFQQJVEY2AGIURWBNLYAYCKFE3DFOA3IDI3M",
        "YSYPRLEUWTKH4EWCGYSZWXP2B6SSBMPM2K56PQICBQAX5XL5745PLGP4CU",
        "KCZGY4VE3UUFDH5WBNDJMTE5UKY7Y6ZNEBS567T2LTMJHZG5AX6TQKKJMA"
    ]

def distribute_tokens(wallet_addresses):
    try:
        # Fetch account info
        account_info = algod_client.account_info(address)
        
        # Get suggested parameters
        params = algod_client.suggested_params()
        
        # Create transactions for each wallet
        transactions = []
        for wallet_address in wallet_addresses:
            # Create asset transfer transaction
            txn = transaction.AssetTransferTxn(
                sender=address,
                sp=params,
                receiver=wallet_address,
                amt=8880000,  # 8.88m tokens per user per day (~$0.02 worth)
                index=ASSET_ID,
                note="SocialTag daily rewards".encode()
            )
            transactions.append(txn)
        
        # Group transactions if there are multiple
        if len(transactions) > 1:
            transaction.assign_group_id(transactions)
        
        # Sign all transactions
        signed_txns = [txn.sign(private_key) for txn in transactions]
        
        # Submit transactions and collect results
        tx_ids = []
        for signed_txn in signed_txns:
            try:
                tx_id = algod_client.send_transaction(signed_txn)
                # Wait for confirmation
                transaction.wait_for_confirmation(algod_client, tx_id, 4)
                tx_ids.append(tx_id)
            except Exception as tx_error:
                print(f"Transaction Error: {str(tx_error)}", file=sys.stderr)
                continue
        
        return tx_ids

    except Exception as error:
        print(f"Error: {str(error)}", file=sys.stderr)
        raise

if __name__ == "__main__":
    try:
        # Get all wallet addresses
        wallet_addresses = get_wallet_addresses()
        
        if not wallet_addresses:
            print("No wallet addresses found for distribution")
            sys.exit(0)
        
        # Distribute tokens
        tx_ids = distribute_tokens(wallet_addresses)
        
        # Print results
        print(f"DistributionResults:{json.dumps(tx_ids)}")
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)
