"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import axios, { AxiosError } from 'axios';
import { useToast } from "@/components/ui/use-toast";

interface Transaction {
  amount: number;
  timestamp: string;
  txId: string;
}

interface User {
  twitter?: {
    username: string;
  };
}

interface ImmersveRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  connectedWalletAddress: string | null;
}

const API_BASE_URL = 'https://socialtagbackend.onrender.com';

const ImmersveRewardsModal: React.FC<ImmersveRewardsModalProps> = ({
  isOpen,
  onClose,
  user,
  connectedWalletAddress
}) => {
  const [fundAddress, setFundAddress] = useState<string>('');
  const [rewardAddress, setRewardAddress] = useState<string>('');
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activePanel, setActivePanel] = useState<string | null>('register');
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const fetchUserRewardsData = useCallback(async () => {
    if (!user.twitter?.username) return;
  
    try {
      setLoading(true);
      
      const userResponse = await axios.get(`${API_BASE_URL}/api/immersveUser/${user.twitter.username}`, {
        withCredentials: true
      });
      
      if (userResponse.data) {
        setIsRegistered(true);
        setFundAddress(userResponse.data.immersveAddress || '');
        setRewardAddress(userResponse.data.rewardAddress || '');
        
        if (userResponse.data.immersveAddress) {
          const txResponse = await axios.get(
            `${API_BASE_URL}/api/immersveTransactions?address=${userResponse.data.immersveAddress}`,
            { withCredentials: true }
          );
          setTransactions(txResponse.data.transactions || []);
        }
      }
    } catch (error: unknown) {
      // 404 is expected for new users, only show error for other cases
      if (error instanceof AxiosError && error.response?.status !== 404) {
        console.error('Error fetching rewards data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch rewards data",
          variant: "destructive"
        });
      }
      setIsRegistered(false);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (isOpen && user.twitter?.username) {
      fetchUserRewardsData();
    }
  }, [isOpen, user, fetchUserRewardsData]);

  const handleRegistration = async () => {
    if (!fundAddress || !rewardAddress || !user.twitter?.username) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/immersveRegister`, {
        twitterUsername: user.twitter.username,
        immersveAddress: fundAddress,
        rewardAddress: rewardAddress || connectedWalletAddress
      }, {
        withCredentials: true
      });
      
      setIsRegistered(true);
      await fetchUserRewardsData();
      
      toast({
        title: "Success",
        description: "Registration completed successfully",
        duration: 3000
      });
      
      // Switch to transactions panel after successful registration
      setActivePanel('transactions');
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error('Registration error:', error);
        toast({
          title: "Registration Failed",
          description: error.response?.data?.message || "Unable to complete registration",
          variant: "destructive"
        });
      } else {
        console.error('Unexpected error:', error);
        toast({
          title: "Registration Failed",
          description: "Unable to complete registration",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePanel = (panel: string) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  if (!isOpen) return null;

  if (!user.twitter?.username) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg max-w-3xl w-full">
          <div className="text-red-500 mb-4">
            Please connect your Twitter account to access Immersve rewards.
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">Close</Button>
          </div>
        </div>
      </div>
    );
  }

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
            <span>{isRegistered ? 'Registered' : 'Register'}</span>
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
                  disabled={isRegistered || loading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reward Receiving Address</label>
                <Input
                  placeholder={connectedWalletAddress || "Enter address to receive rewards"}
                  value={rewardAddress || connectedWalletAddress || ''}
                  onChange={(e) => setRewardAddress(e.target.value)}
                  className="border-2 border-black"
                  disabled={!!connectedWalletAddress || isRegistered || loading}
                />
              </div>
              {!isRegistered && (
                <Button 
                  onClick={handleRegistration} 
                  className="w-full bg-[#FF6B6B] text-black hover:bg-[#FF6B6B]/90 border-2 border-black"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Register'}
                </Button>
              )}
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
              {loading ? (
                <p className="text-center">Loading transactions...</p>
              ) : isRegistered ? (
                transactions.length > 0 ? (
                  transactions.map((tx, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-4 border-2 border-black rounded-lg"
                    >
                      <div>
                        <p className="font-semibold">
                          {new Date(tx.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">${tx.amount.toFixed(2)} USDC</p>
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
                  ))
                ) : (
                  <p className="text-center text-gray-500">No transactions yet</p>
                )
              ) : (
                <p className="text-center text-gray-500">Please register to view transactions</p>
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