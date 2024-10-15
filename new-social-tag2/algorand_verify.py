import os
import sys
import json
from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk import transaction
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Load environment variables
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""  # Not required for AlgoNode
MNEMONIC = os.getenv("ALGORAND_MNEMONIC")
APP_ID = int(os.getenv("ALGORAND_APP_ID"))

if not MNEMONIC:
    raise ValueError("ALGORAND_MNEMONIC environment variable is not set")

if not APP_ID:
    raise ValueError("ALGORAND_APP_ID environment variable is not set")

# Create Algod client
algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

# Get account from mnemonic
private_key = mnemonic.to_private_key(MNEMONIC)
address = account.address_from_private_key(private_key)

def create_verification_transaction(verification_data):
    try:
        # Fetch account info
        account_info = algod_client.account_info(address)

        # Get suggested parameters
        params = algod_client.suggested_params()
        
        # Convert verification_data to JSON string and then to bytes
        verification_data_bytes = json.dumps(verification_data).encode('utf-8')
        
        # Create application call transaction
        txn = transaction.ApplicationCallTxn(
            sender=address,
            sp=params,
            index=APP_ID,
            on_complete=transaction.OnComplete.NoOpOC,
            app_args=[b"verify", verification_data_bytes]
        )

        # Sign transaction
        signed_txn = txn.sign(private_key)

        # Submit transaction
        tx_id = algod_client.send_transaction(signed_txn)

        # Wait for the transaction to be confirmed
        confirmed_txn = transaction.wait_for_confirmation(algod_client, tx_id, 4)
        
        return tx_id

    except Exception as error:
        raise Exception(f"Error in create_verification_transaction: {str(error)}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python algorand_verify.py '<verification_data_json>'")
        sys.exit(1)

    try:
        verification_data = json.loads(sys.argv[1])
        tx_id = create_verification_transaction(verification_data)
        print(tx_id)  # This will be captured by the Node.js script
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)