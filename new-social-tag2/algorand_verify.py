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
ALGOD_ADDRESS = "https://mainnet-api.algonode.cloud"
ALGOD_TOKEN = ""  # Not required for AlgoNode
MNEMONIC = os.getenv("ALGORAND_MNEMONIC")
APP_ID = os.getenv("ALGORAND_APP_ID")

if not MNEMONIC:
    raise ValueError("ALGORAND_MNEMONIC environment variable is not set")

if not APP_ID:
    raise ValueError("ALGORAND_APP_ID environment variable is not set")

try:
    APP_ID = int(APP_ID)
except ValueError:
    raise ValueError(f"ALGORAND_APP_ID must be an integer, got: {APP_ID}")

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
        transaction.wait_for_confirmation(algod_client, tx_id, 4)
        
        return tx_id

    except Exception as error:
        print(f"Error: {str(error)}", file=sys.stderr)
        raise

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python algorand_verify.py '<json_data>' OR python algorand_verify.py <path_to_json_file>")
        sys.exit(1)

    input_data = sys.argv[1]

    try:
        # Try to parse the input as JSON
        try:
            verification_data = json.loads(input_data)
        except json.JSONDecodeError:
            # If it's not valid JSON, assume it's a file path
            with open(input_data, 'r') as json_file:
                verification_data = json.load(json_file)

        tx_id = create_verification_transaction(verification_data)
        print(f"AlgorandTransactionID:{tx_id}")  # Print only the transaction ID with a prefix
    except json.JSONDecodeError as json_error:
        print(f"Error: {str(json_error)}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)