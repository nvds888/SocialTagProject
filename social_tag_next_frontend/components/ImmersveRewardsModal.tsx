"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import axios, { AxiosError } from 'axios';
import { useToast } from "@/components/ui/use-toast";
import Image from 'next/image';

interface ImmersveReward {
  assetId: number;
  amount: number;
  txId: string;
  timestamp: Date;
}

interface Transaction {
  usdcAmount: number;
  timestamp: Date;
  txId: string;
  isInnerTx?: boolean;
  rewards: ImmersveReward[];
  processed: boolean;
}

interface User {
  twitter?: {
    username: string;
  };
}

interface RewardPool {
  token: string;
  assetId: number;
  icon: string;
  totalPool: number;
  distributed: number;
  rewardRate: string;
  isOptedIn: boolean;
}

interface ImmersveRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  connectedWalletAddress: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

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
  const [pools, setPools] = useState<RewardPool[]>([]);
  const { toast } = useToast();

  const fetchPoolData = useCallback(async () => {
    if (!rewardAddress) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/reward-pools/${rewardAddress}`, {
        withCredentials: true
      });
      setPools(response.data.pools);
    } catch (error) {
      console.error('Error fetching pool data:', error);
    }
  }, [rewardAddress]);

  const fetchUserRewardsData = useCallback(async () => {
    if (!user.twitter?.username) return;
  
    try {
      setLoading(true);
      
      const userResponse = await axios.get(`${API_BASE_URL}/immersveUser/${user.twitter.username}`, {
        withCredentials: true
      });
      
      if (userResponse.data && userResponse.data.immersveAddress) {
        setIsRegistered(true);
        setFundAddress(userResponse.data.immersveAddress || '');
        setRewardAddress(userResponse.data.immersveRewardAddress || '');
        
        // Fetch transactions from backend which now includes rewards
        const txResponse = await axios.get(
          `${API_BASE_URL}/immersveTransactions?address=${userResponse.data.immersveAddress}`,
          { withCredentials: true }
        );
        setTransactions(txResponse.data.transactions || []);
        
        // After setting reward address, fetch pool data
        if (userResponse.data.immersveRewardAddress) {
          await fetchPoolData();
        }
      }
    } catch (error: unknown) {
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
  }, [user, toast, fetchPoolData]);

  useEffect(() => {
    if (isOpen) {
      fetchUserRewardsData();
    }
  }, [isOpen, fetchUserRewardsData]);

  const handleRegistration = async () => {
    if (!fundAddress || (!rewardAddress && !connectedWalletAddress) || !user.twitter?.username) {
      const missing = [];
      if (!fundAddress) missing.push('fund address');
      if (!rewardAddress && !connectedWalletAddress) missing.push('reward address');
      if (!user.twitter?.username) missing.push('Twitter connection');
      
      toast({
        title: "Validation Error",
        description: `Please provide: ${missing.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const finalRewardAddress = rewardAddress || connectedWalletAddress;
      
      await axios.post(`${API_BASE_URL}/immersveRegister`, {
        twitterUsername: user.twitter.username,
        immersveAddress: fundAddress,
        rewardAddress: finalRewardAddress
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setIsRegistered(true);
      await fetchUserRewardsData();
      
      toast({
        title: "Success",
        description: "Registration completed successfully",
        duration: 3000
      });
      
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
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg max-w-3xl w-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0)]">
          <div className="text-red-500 mb-4">
            Please connect your Twitter account to access Immersve rewards.
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose} className="bg-white text-black border-2 border-black hover:bg-gray-100 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0)] hover:translate-x-[1px] hover:translate-y-[1px]">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white text-black p-6 rounded-lg max-w-3xl w-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Immersve Payment Rewards
          </h2>
        </div>

        <div className="space-y-4">
          {/* Register Panel */}
          <Button
            onClick={() => togglePanel('register')}
            className="w-full flex justify-between items-center py-2 px-4 bg-white text-black border-2 border-black hover:bg-gray-100 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0)] hover:translate-x-[1px] hover:translate-y-[1px]"
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
                  className="border-2 border-black bg-white text-black"
                  disabled={isRegistered || loading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reward Receiving Address</label>
                <Input
                  placeholder={connectedWalletAddress || "Enter address to receive rewards"}
                  value={rewardAddress || connectedWalletAddress || ''}
                  onChange={(e) => setRewardAddress(e.target.value)}
                  className="border-2 border-black bg-white text-black"
                  disabled={!!connectedWalletAddress || isRegistered || loading}
                />
              </div>
              {!isRegistered && (
                <Button 
                  onClick={handleRegistration} 
                  className="w-full bg-[#FF6B6B] text-black hover:bg-[#FF6B6B]/90 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0)] hover:translate-x-[1px] hover:translate-y-[1px]"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Register'}
                </Button>
              )}
            </div>
          )}

          {/* Transactions Panel */}
          <Button
            onClick={() => togglePanel('transactions')}
            className="w-full flex justify-between items-center py-2 px-4 bg-white text-black border-2 border-black hover:bg-gray-100 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0)] hover:translate-x-[1px] hover:translate-y-[1px]"
          >
            <span>Transactions</span>
            {activePanel === 'transactions' ? <ChevronUp /> : <ChevronDown />}
          </Button>

          {activePanel === 'transactions' && (
            <div className="border-2 border-black rounded-lg">
              <div className="max-h-[400px] overflow-y-auto p-4 space-y-4">
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
                          <p className="font-semibold">{new Date(tx.timestamp).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-600">
                            ${tx.usdcAmount.toFixed(2)} USDC {tx.isInnerTx ? '(Inner Transaction)' : ''}
                          </p>
                          {tx.rewards.map((reward, rewardIndex) => (
                            <p key={rewardIndex} className="text-xs text-[#40E0D0] font-medium">
                              +{(reward.amount / 1_000_000_000).toFixed(2)}B {reward.assetId === 2607097066 ? 'SOCIALS' : 'MEEP'}
                            </p>
                          ))}
                        </div>
                        <div className="flex flex-col space-y-2">
                          {tx.rewards.map((reward, rewardIndex) => (
                            <a
                              key={rewardIndex}
                              href={`https://algoexplorer.io/tx/${reward.txId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#40E0D0] hover:underline text-sm"
                            >
                              Reward {rewardIndex + 1}
                            </a>
                          ))}
                          <a
                            href={`https://algoexplorer.io/tx/${tx.txId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#FF6B6B] hover:underline text-sm"
                          >
                            Payment
                          </a>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-600">No transactions yet</p>
                  )
                ) : (
                  <p className="text-center text-gray-600">Please register to view transactions</p>
                )}
              </div>
            </div>
          )}

          {/* Reward Pools Panel */}
          <Button
            onClick={() => togglePanel('pools')}
            className="w-full flex justify-between items-center py-2 px-4 bg-white text-black border-2 border-black hover:bg-gray-100 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0)] hover:translate-x-[1px] hover:translate-y-[1px]"
          >
            <span>Reward Pools</span>
            {activePanel === 'pools' ? <ChevronUp /> : <ChevronDown />}
          </Button>

          {activePanel === 'pools' && (
            <div className="space-y-4 p-4 border-2 border-black rounded-lg">
              {pools.map((pool) => (
                <div 
                  key={pool.token}
                  className="flex items-center justify-between p-4 border-2 border-black rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Image 
                      src={pool.icon} 
                      alt={pool.token} 
                      width={32} 
                      height={32} 
                      className="rounded-full"
                    />
                    <div>
                      <p className="font-semibold">{pool.token}</p>
                      <p className="text-sm text-gray-600">
                        {((pool.totalPool - pool.distributed) / 1_000_000_000).toFixed(2)}B available
                      </p>
                      <p className="text-xs text-gray-500">
                        Rate: {pool.rewardRate}
                      </p>
                      <p className={`text-xs ${pool.isOptedIn ? 'text-green-500' : 'text-red-500'}`}>
                        {pool.isOptedIn ? 'Active' : 'Not Opted In'}
                      </p>
                    </div>
                  </div>
                  <div className="w-1/3">
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className={`h-full rounded-full ${pool.isOptedIn ? 'bg-[#FF6B6B]' : 'bg-gray-400'}`}
                        style={{ 
                          width: `${((pool.totalPool - pool.distributed) / pool.totalPool) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button 
            onClick={onClose} 
            className="bg-white text-black border-2 border-black hover:bg-gray-100 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0)] hover:translate-x-[1px] hover:translate-y-[1px]"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImmersveRewardsModal;