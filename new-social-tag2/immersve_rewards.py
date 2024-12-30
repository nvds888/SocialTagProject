import os
import sys
import json
from datetime import datetime, timezone
import pymongo
import requests
from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk import transaction
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base constants
ALGOD_ADDRESS = "https://mainnet-api.algonode.cloud"
ALGOD_TOKEN = ""
MNEMONIC = os.getenv("ALGORAND_MNEMONIC")
MONGO_URI = os.getenv("MONGODB_URI")

# Immersve constants
IMMERSVE_MASTER_CONTRACT = "UAKUGWMTFQJLUWMY4DYLVVAC67NOLUGGW6MIVAIPUU2APLTAKWSCQAJIEM"
IMMERSVE_APP_ID = 2174001591

# Token configurations
REWARD_TOKENS = {
    "SOCIALS": {
        "asset_id": 2607097066,
        "reward_rate": 1_000_000_000,  # 1M tokens per 1 USDC
        "total_pool": 8_000_000_000_000_000,  # 8B tokens
        "note": "SocialTag cashback rewards"
    }
}

PAYMENT_TOKENS = {
    "USDC": {
        "asset_id": 31566704,
        "decimal_adjustment": 1_000_000  # microUSDC to USDC conversion
    }
}

def setup_mongo_client():
    """Setup MongoDB connection and return database"""
    try:
        client = pymongo.MongoClient(MONGO_URI)
        db = client.get_default_database()
        print("Successfully connected to MongoDB")
        return db
    except Exception as e:
        print(f"Failed to connect to MongoDB: {str(e)}", file=sys.stderr)
        raise

def get_remaining_pool(db, token_name):
    """Get remaining reward token pool amount"""
    stats = db.statistics.find_one({"type": "reward_pool"}) or {}
    distributed = stats.get(f"{token_name.lower()}_distributed", 0)
    total_pool = REWARD_TOKENS[token_name]["total_pool"]
    remaining = total_pool - distributed
    print(f"Remaining {token_name} pool: {remaining}")
    return remaining

def update_pool_distribution(db, token_name, amount):
    """Update the distributed amount for a reward token"""
    print(f"Updating distributed amount for {token_name}: +{amount}")
    db.statistics.update_one(
        {"type": "reward_pool"},
        {
            "$inc": {f"{token_name.lower()}_distributed": amount}
        },
        upsert=True
    )

def get_new_transactions(fund_address):
    """Fetch new USDC transactions to master contract"""
    try:
        print(f"Fetching transactions for fund address: {fund_address}")
        response = requests.get(
            f"https://mainnet-idx.4160.nodely.dev/v2/accounts/{fund_address}/transactions",
            params={"address": IMMERSVE_MASTER_CONTRACT}
        )
        response.raise_for_status()
        data = response.json()
        transactions = []

        for tx in data.get("transactions", []):
            tx_list = [tx] + (tx.get("inner-txns") or [])
            
            for t in tx_list:
                if (t["tx-type"] == "axfer" and
                    t.get("asset-transfer-transaction", {}).get("asset-id") == PAYMENT_TOKENS["USDC"]["asset_id"] and
                    t.get("asset-transfer-transaction", {}).get("receiver") == IMMERSVE_MASTER_CONTRACT):
                    
                    amount = t["asset-transfer-transaction"]["amount"] / PAYMENT_TOKENS["USDC"]["decimal_adjustment"]
                    print(f"Found qualifying transaction: {tx['id']} - Amount: {amount} USDC")
                    
                    transactions.append({
                        "txId": tx["id"],
                        "amount": amount,
                        "timestamp": datetime.fromtimestamp(tx["round-time"], tz=timezone.utc)
                    })

        return transactions
    except Exception as e:
        print(f"Error fetching transactions: {str(e)}", file=sys.stderr)
        return []

def calculate_reward(token_config, payment_amount):
    """Calculate reward amount based on payment amount"""
    reward = int(payment_amount * token_config["reward_rate"])
    print(f"Calculated reward: {reward} for {payment_amount} USDC payment")
    return reward

def distribute_reward(algod_client, sender_address, private_key, receiver_address, amount, token_config):
    """Send reward tokens to user"""
    try:
        print(f"Distributing {amount} tokens to {receiver_address}")
        params = algod_client.suggested_params()
        
        txn = transaction.AssetTransferTxn(
            sender=sender_address,
            sp=params,
            receiver=receiver_address,
            amt=amount,
            index=token_config["asset_id"],
            note=token_config["note"].encode()
        )
        
        signed_txn = txn.sign(private_key)
        tx_id = algod_client.send_transaction(signed_txn)
        print(f"Reward transaction submitted: {tx_id}")
        
        # Wait for confirmation
        transaction.wait_for_confirmation(algod_client, tx_id, 4)
        print("Reward transaction confirmed")
        return tx_id
    except Exception as e:
        print(f"Error distributing reward: {str(e)}", file=sys.stderr)
        return None

def main():
    try:
        print("Starting Immersve rewards distribution")
        
        # Setup connections
        db = setup_mongo_client()
        algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
        private_key = mnemonic.to_private_key(MNEMONIC)
        sender_address = account.address_from_private_key(private_key)
        
        print(f"Distribution wallet address: {sender_address}")

        # Process each reward token
        distribution_results = []
        
        for token_name, token_config in REWARD_TOKENS.items():
            remaining_pool = get_remaining_pool(db, token_name)
            if remaining_pool <= 0:
                print(f"No more {token_name} tokens in pool")
                continue

            print(f"\nProcessing {token_name} rewards")
            
            # Get all users with Immersve addresses
            users = list(db.users.find({
                "immersveAddress": {"$ne": None},
                "immersveRewardAddress": {"$ne": None}
            }))
            
            print(f"Found {len(users)} registered users")

            for user in users:
                try:
                    username = user.get("twitter", {}).get("username", "Unknown")
                    print(f"\nProcessing user: {username}")
                    
                    fund_address = user["immersveAddress"]
                    reward_address = user["immersveRewardAddress"]
                    
                    # Get all transactions
                    transactions = get_new_transactions(fund_address)
                    
                    # Filter out processed transactions
                    processed_tx_ids = {tx["txId"] for tx in user.get("processedTransactions", [])}
                    new_transactions = [tx for tx in transactions if tx["txId"] not in processed_tx_ids]
                    
                    print(f"Found {len(new_transactions)} new transactions")

                    for tx in new_transactions:
                        try:
                            print(f"\nProcessing transaction {tx['txId']}")
                            
                            # Calculate reward
                            reward_amount = calculate_reward(token_config, tx["amount"])
                            
                            # Check if enough tokens in pool
                            if reward_amount > remaining_pool:
                                print(f"Insufficient tokens in pool. Needed: {reward_amount}, Available: {remaining_pool}")
                                continue
                            
                            # Distribute reward
                            reward_tx_id = distribute_reward(
                                algod_client,
                                sender_address,
                                private_key,
                                reward_address,
                                reward_amount,
                                token_config
                            )
                            
                            if reward_tx_id:
                                # Update user record
                                db.users.update_one(
                                    {"_id": user["_id"]},
                                    {
                                        "$push": {
                                            "processedTransactions": {
                                                "txId": tx["txId"],
                                                "amount": tx["amount"],
                                                "timestamp": tx["timestamp"],
                                                "rewardAmount": reward_amount,
                                                "rewardTxId": reward_tx_id,
                                                "token": token_name,
                                                "processed": True
                                            }
                                        }
                                    }
                                )
                                
                                # Update pool statistics
                                update_pool_distribution(db, token_name, reward_amount)
                                remaining_pool -= reward_amount
                                
                                distribution_results.append({
                                    "user": username,
                                    "txId": tx["txId"],
                                    "rewardTxId": reward_tx_id,
                                    "amount": tx["amount"],
                                    "rewardAmount": reward_amount,
                                    "token": token_name
                                })
                                
                                print(f"Successfully processed transaction {tx['txId']}")
                            else:
                                print(f"Failed to distribute reward for transaction {tx['txId']}")
                                
                        except Exception as tx_error:
                            print(f"Error processing transaction: {str(tx_error)}", file=sys.stderr)
                            continue
                    
                except Exception as user_error:
                    print(f"Error processing user {username}: {str(user_error)}", file=sys.stderr)
                    continue

        print(f"\nCompleted processing. Successful distributions: {len(distribution_results)}")
        print(f"DistributionResults:{json.dumps(distribution_results)}")

    except Exception as e:
        print(f"Error in main execution: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()