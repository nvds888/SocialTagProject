import sys
import subprocess
import pkg_resources
import traceback

def check_and_install_packages():
    required_packages = ['py-algorand-sdk', 'pyteal', 'python-dotenv']
    installed_packages = [pkg.key for pkg in pkg_resources.working_set]
    missing_packages = [pkg for pkg in required_packages if pkg.replace('-', '_') not in installed_packages]

    if missing_packages:
        print("Some required packages are missing. Attempting to install them...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install"] + missing_packages)
            print("Packages installed successfully.")
        except subprocess.CalledProcessError:
            print("Failed to install packages. Please run the following command manually:")
            print(f"{sys.executable} -m pip install {' '.join(missing_packages)}")
            sys.exit(1)

    print("All required packages are installed.")

check_and_install_packages()

import os
from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk import transaction
import json
import base64
from pyteal import *
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Load environment variables
ALGOD_ADDRESS = "https://mainnet-api.algonode.cloud"
ALGOD_TOKEN = ""  # Not required for AlgoNode
MNEMONIC = os.getenv("ALGORAND_MNEMONIC")

if not MNEMONIC:
    print("ALGORAND_MNEMONIC environment variable is not set.")
    print("Please create a .env file in the same directory as this script with the following content:")
    print('ALGORAND_MNEMONIC="your twenty-five word mnemonic here"')
    sys.exit(1)

# Create Algod client
algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

# Get account from mnemonic
private_key = mnemonic.to_private_key(MNEMONIC)
address = account.address_from_private_key(private_key)

def compile_smart_contract():
    program = Approve()
    return compileTeal(program, Mode.Application, version=5)

def create_app():
    # Compile programs
    approval_program = compile_smart_contract()
    clear_program = compileTeal(Approve(), Mode.Application, version=5)

    # Compile program to binary
    approval_program_compiled = algod_client.compile(approval_program)
    clear_program_compiled = algod_client.compile(clear_program)

    # Create new application
    txn = transaction.ApplicationCreateTxn(
        sender=address,
        sp=algod_client.suggested_params(),
        on_complete=transaction.OnComplete.NoOpOC.real,
        approval_program=base64.b64decode(approval_program_compiled['result']),
        clear_program=base64.b64decode(clear_program_compiled['result']),
        global_schema=transaction.StateSchema(num_uints=1, num_byte_slices=1),
        local_schema=transaction.StateSchema(num_uints=0, num_byte_slices=0)
    )

    # Sign transaction
    signed_txn = txn.sign(private_key)
    tx_id = signed_txn.get_txid()

    # Send transaction
    algod_client.send_transaction(signed_txn)

    # Wait for the transaction to be confirmed
    confirmed_txn = transaction.wait_for_confirmation(algod_client, tx_id, 4)
    
    # Get the newly created application ID
    app_id = confirmed_txn["application-index"]
    print(f"Created new app-id: {app_id}")
    return app_id

if __name__ == "__main__":
    try:
        print(f"Connecting to Algod at {ALGOD_ADDRESS}")
        print(f"Using account address: {address}")
        
        # Test connection
        try:
            algod_client.status()
            print("Successfully connected to the Algorand node")
        except Exception as e:
            print(f"Failed to connect to Algorand node: {str(e)}")
            raise

        app_id = create_app()
        print(f"Created Algorand app with ID: {app_id}")
        print("Please save this app_id in your environment variables as ALGORAND_APP_ID")
        
        # Automatically add this to the .env file
        with open('.env', 'a') as env_file:
            env_file.write(f'\nALGORAND_APP_ID={app_id}\n')
        print(f"Added ALGORAND_APP_ID={app_id} to .env file")
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        print("Detailed error information:")
        print(traceback.format_exc())
        print("Please ensure you have sufficient Algos in your account to create the application.")
        print("If you're using mainnet, make sure your account has enough real Algos.")