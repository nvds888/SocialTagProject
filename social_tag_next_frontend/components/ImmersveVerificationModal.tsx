import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

interface ImmersveVerificationModalProps {
    fundAddress: string;
    rewardAddress: string | null;
    onVerificationComplete: () => void;
    onClose: () => void;
}

interface Transaction {
  'tx-type': string;
  'group'?: string;
  'application-id'?: number;
  sender: string;
  'payment-transaction'?: {
    amount: number;
  };
}

const ImmersveVerificationModal: React.FC<ImmersveVerificationModalProps> = ({
  fundAddress,
  onVerificationComplete,
  onClose
}) => {
  const [creatorAddress, setCreatorAddress] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('waiting'); // waiting, pending, success, failed
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const verificationAddress = 'MQYGWBVAXQHTOFWTF4KZZ3EAP6L45NCGG7JQCBH3622FVEX57WGAR7DJEI';

  useEffect(() => {
    const fetchCreatorAddress = async () => {
      try {
        const response = await fetch(
          `https://mainnet-idx.4160.nodely.dev/v2/accounts/${fundAddress}/transactions?application-id=2174001591`
        );
        
        const data = await response.json();
        
        if (data && data.transactions) {
          const createTx = (data.transactions as Transaction[]).find(tx => 
            tx['tx-type'] === 'appl' && 
            tx['group']
          );
          
          if (createTx) {
            setCreatorAddress(createTx.sender);
            console.log("Found creator:", createTx.sender);
          } else {
            throw new Error('Creator address not found');
          }
        }
      } catch (error) {
        console.error('Error fetching creator address:', error);
        setVerificationStatus('failed');
      }
    };

    fetchCreatorAddress();
  }, [fundAddress]);

  useEffect(() => {
    if (verificationStatus === 'pending' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
    if (timeLeft === 0) {
      setVerificationStatus('failed');
    }
  }, [timeLeft, verificationStatus]);

  const startVerification = () => {
    setVerificationStatus('pending');
  };

  const checkVerification = async () => {
    try {
      const threeMinutesAgo = Math.floor(Date.now() / 1000) - 180;
      const response = await fetch(
        `https://mainnet-idx.4160.nodely.dev/v2/accounts/${verificationAddress}/transactions?after-time=${threeMinutesAgo}`
      );
      const data = await response.json();
      
      const verificationTx = (data.transactions as Transaction[])?.find(tx => 
        tx.sender === creatorAddress &&
        tx['payment-transaction']?.amount === 100000 // 0.1 Algo
      );
      
      if (verificationTx) {
        setVerificationStatus('success');
        onVerificationComplete();
      } else {
        setVerificationStatus('failed');
      }
    } catch (error) {
      console.error('Error checking verification:', error);
      setVerificationStatus('failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
        <h2 className="text-xl font-bold">Verify Fund Ownership</h2>
        
        {verificationStatus === 'waiting' && creatorAddress && (
          <>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
              <p className="text-gray-700">
                Please send exactly 0.1 ALGO from address:
              </p>
              <code className="block bg-gray-100 p-2 rounded text-sm break-all">
                {creatorAddress}
              </code>
              <p className="text-gray-700">to address (scan QR or copy):</p>
              <div className="flex flex-col items-center space-y-2">
                <Image
                  src="/verificationqr.png"
                  alt="Verification QR Code"
                  width={200}
                  height={200}
                  className="rounded-lg"
                />
                <code className="block bg-gray-100 p-2 rounded text-sm break-all w-full text-center">
                  {verificationAddress}
                </code>
              </div>
            </div>
            <Button 
              onClick={startVerification}
              className="w-full bg-black text-white hover:bg-gray-800"
            >
              Start Verification
            </Button>
          </>
        )}

        {verificationStatus === 'pending' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="animate-spin" />
              <span>Waiting for transaction...</span>
            </div>
            <div className="text-center">Time remaining: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
            <Button
              onClick={checkVerification}
              className="w-full bg-black text-white hover:bg-gray-800"
            >
              Check Verification
            </Button>
          </div>
        )}

        {verificationStatus === 'success' && (
          <div className="bg-green-50 border border-green-500 rounded-lg p-4">
            <p className="text-green-700">
              Verification successful! Completing registration...
            </p>
          </div>
        )}

        {verificationStatus === 'failed' && (
          <>
            <div className="bg-red-50 border border-red-500 rounded-lg p-4">
              <p className="text-red-700">
                Verification failed. Please try again.
              </p>
            </div>
            <Button
              onClick={() => {
                setVerificationStatus('waiting');
                setTimeLeft(180);
              }}
              className="w-full bg-black text-white hover:bg-gray-800"
            >
              Retry
            </Button>
          </>
        )}

        <Button
          onClick={onClose}
          variant="outline"
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default ImmersveVerificationModal;