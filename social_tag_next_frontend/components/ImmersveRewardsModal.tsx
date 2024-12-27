"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface Transaction {
  amount: number;
  timestamp: string;
  txId: string;
}

interface ImmersveProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    twitter?: {
      username: string;
    };
  };
  connectedWalletAddress: string | null;
}

const ImmersveRewardsModal: React.FC<ImmersveProps> = ({
  isOpen,
  onClose,
  user,
  connectedWalletAddress
}) => {
  const [fundAddress, setFundAddress] = useState('');
  const [rewardAddress, setRewardAddress] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUserRewardsData = useCallback(async () => {
    try {
      const userResponse = await axios.get(`${API_BASE_URL}/immersveRoutes/user/${user.twitter?.username}`);
      
      if (userResponse.data) {
        setIsRegistered(true);
        setFundAddress(userResponse.data.immersveAddress);
        setRewardAddress(userResponse.data.rewardAddress);
        
        const txResponse = await axios.get(`${API_BASE_URL}/immersveRoutes/transactions?address=${userResponse.data.immersveAddress}`);
        setTransactions(txResponse.data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching rewards data:', error);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user?.twitter?.username) {
      fetchUserRewardsData();
    }
  }, [isOpen, user, fetchUserRewardsData]);

  const handleRegistration = async () => {
    if (!fundAddress || !rewardAddress || !user?.twitter?.username) {
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/immersveRoutes/register`, {
        twitterUsername: user.twitter.username,
        immersveAddress: fundAddress,
        rewardAddress: rewardAddress || connectedWalletAddress
      });
      
      setIsRegistered(true);
      await fetchUserRewardsData();
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePanel = (panel: string) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-3xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Immersve Payment Rewards
          </h2>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => togglePanel('register')}
            className="w-full flex justify-between items-center py-2 px-4"
            variant="outline"
          >
            <span>Register{isRegistered ? 'ed' : ''}</span>
            {activePanel === 'register' ? <ChevronUp /> : <ChevronDown />}
          </Button>

          {activePanel === 'register' && (
            <div className="space-y-4 p-4 border-2 border-black rounded-lg">
              <div className="space-y-2">
                <label className="text-sm font-medium">Immersve Fund Address</label>
                <Input
                  placeholder="Enter your fund contract address"
                  value={fundAddress}
                  onChange={(e) => setFundAddress(e.target.value)}
                  className="border-2 border-black"
                  disabled={isRegistered}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reward Receiving Address</label>
                <Input
                  placeholder={connectedWalletAddress || "Enter address to receive rewards"}
                  value={rewardAddress || connectedWalletAddress || ''}
                  onChange={(e) => setRewardAddress(e.target.value)}
                  className="border-2 border-black"
                  disabled={!!connectedWalletAddress || isRegistered}
                />
              </div>
              <Button 
                onClick={handleRegistration} 
                className="w-full bg-[#FF6B6B] text-black hover:bg-[#FF6B6B]/90 border-2 border-black"
                disabled={loading || isRegistered}
              >
                {loading ? 'Registering...' : (isRegistered ? 'Registered' : 'Register')}
              </Button>
            </div>
          )}

          <Button
            onClick={() => togglePanel('transactions')}
            className="w-full flex justify-between items-center"
            variant="outline"
          >
            <span>Transactions</span>
            {activePanel === 'transactions' ? <ChevronUp /> : <ChevronDown />}
          </Button>

          {activePanel === 'transactions' && (
            <div className="space-y-4 p-4 border-2 border-black rounded-lg">
              {transactions.map((tx, index) => (
                <div key={index} className="flex items-center justify-between p-4 border-2 border-black rounded-lg">
                  <div>
                    <p className="font-semibold">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">${tx.amount} USDC</p>
                  </div>
                  {tx.txId && (
                    <a
                      href={`https://explorer.perawallet.app/tx/${tx.txId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      View
                    </a>
                  )}
                </div>
              ))}
              {transactions.length === 0 && (
                <p className="text-center text-gray-500">No transactions yet</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImmersveRewardsModal;