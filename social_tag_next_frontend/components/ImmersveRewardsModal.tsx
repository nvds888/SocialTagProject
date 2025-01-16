"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ImmersveVerificationModal from '@/components/ImmersveVerificationModal';
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
  onRegistrationSuccess: () => Promise<void>;
}


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

const ImmersveRewardsModal: React.FC<ImmersveRewardsModalProps> = ({
  isOpen,
  onClose,
  user,
  connectedWalletAddress,
  onRegistrationSuccess
}) => {
  const [fundAddress, setFundAddress] = useState<string>('');
  const [rewardAddress, setRewardAddress] = useState<string>('');
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activePanel, setActivePanel] = useState<string | null>('register');
  const [loading, setLoading] = useState<boolean>(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
const [, setIsVerified] = useState(false);
  const [pools, setPools] = useState<RewardPool[]>([]);
  const { toast } = useToast();


  const fetchUserRewardsData = useCallback(async () => {
    if (!user.twitter?.username) return;
    
    try {
      setLoading(true);
      
      const userResponse = await axios.get(`${API_BASE_URL}/api/immersveUser/${user.twitter.username}`, {
        withCredentials: true
      });
      
      if (userResponse.data && userResponse.data.immersveAddress) {
        setIsRegistered(true);
        setFundAddress(userResponse.data.immersveAddress || '');
        const newRewardAddress = userResponse.data.rewardAddress;
        setRewardAddress(newRewardAddress);
        
        const txResponse = await axios.get(
          `${API_BASE_URL}/api/immersveTransactions?address=${userResponse.data.immersveAddress}`,
          { withCredentials: true }
        );
        setTransactions(txResponse.data.transactions || []);
        
        // Fetch pool data if reward address exists
        if (newRewardAddress) {
          const poolResponse = await axios.get(`${API_BASE_URL}/api/reward-pools/${newRewardAddress}`, {
            withCredentials: true
          });
          setPools(poolResponse.data.pools);
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
  }, [user, toast]);

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
  
    // Show verification modal instead of proceeding directly
    setShowVerificationModal(true);
  };
  
  // Add this new function to handle the actual registration
  const completeRegistration = async () => {
    setLoading(true);
    try {
      const finalRewardAddress = rewardAddress || connectedWalletAddress;
      
      await axios.post(`${API_BASE_URL}/api/immersveRegister`, {
        twitterUsername: user.twitter?.username,
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

      onRegistrationSuccess?.(); 

      
      toast({
        title: "Success",
        description: "Registration completed successfully",
        duration: 3000
      });
      
      setActivePanel('transactions');
    } catch (error) {
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

  const handleDeleteRegistration = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/api/immersveRegister/delete`, {
        twitterUsername: user.twitter?.username
      }, {
        withCredentials: true
      });
      
      // Reset local state
      setIsRegistered(false);
      setFundAddress('');
      setRewardAddress('');
      setTransactions([]);
      setPools([]);
      
      toast({
        title: "Registration Deleted",
        description: "Your Immersve registration has been removed",
        duration: 3000
      });
      
      setActivePanel('register');
    } catch (error) {
      console.error('Error deleting registration:', error);
      toast({
        title: "Error",
        description: "Failed to delete registration",
        variant: "destructive"
      });
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
            Cashback Rewards
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
        readOnly={isRegistered}
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
        readOnly={isRegistered}
      />
    </div>
    {!isRegistered ? (
      <Button 
        onClick={handleRegistration} 
        className="w-full bg-[#FF6B6B] text-black hover:bg-[#FF6B6B]/90 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0)] hover:translate-x-[1px] hover:translate-y-[1px]"
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Register'}
      </Button>
    ) : (
      <Button 
        onClick={handleDeleteRegistration} 
        className="w-full bg-red-500 text-white hover:bg-red-600 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0)] hover:translate-x-[1px] hover:translate-y-[1px]"
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Delete Registration'}
      </Button>
    )}
  </div>
)}

          {/* Transactions Panel */}
          <Button
            onClick={() => togglePanel('transactions')}
            className="w-full flex justify-between items-center py-2 px-4 bg-white text-black border-2 border-black hover:bg-gray-100 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0)] hover:translate-x-[1px] hover:translate-y-[1px]"
          >
            <span>Payments</span>
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
                              +{(reward.amount / 1_000_000_000_000).toFixed(2)}M {reward.assetId === 2607097066 ? 'SOCIALS' : 'MEEP'}
                            </p>
                          ))}
                        </div>
                        <div className="flex flex-col space-y-2">
                          {tx.rewards.map((reward, rewardIndex) => (
                            <a
                              key={rewardIndex}
                              href={`https://explorer.perawallet.app/tx/${reward.txId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#40E0D0] hover:underline text-sm"
                            >
                              Reward {rewardIndex + 1}
                            </a>
                          ))}
                          <a
                            href={`https://explorer.perawallet.app/tx/${tx.txId}`}
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
  <div className="space-y-6 p-4 border-2 border-black rounded-lg">
    <div className="text-sm text-gray-500 italic">
      Live reward pools
    </div>
    {pools.map((pool) => {
      const availableAmount = pool.totalPool - pool.distributed;
      const percentAvailable = ((availableAmount / pool.totalPool) * 100).toFixed(1);
      return (
        <div 
          key={pool.token}
          className="flex flex-col p-4 border-2 border-black rounded-lg bg-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Image 
                src={pool.icon} 
                alt={pool.token} 
                width={40} 
                height={40} 
                className="rounded-full"
              />
              <div>
                <p className="font-bold text-lg">{pool.token}</p>
                {pool.isOptedIn ? (
  <p className="text-sm text-green-600 font-medium">
    ✓ Active
  </p>
) : (
  <div>
    <p className="text-sm text-red-500 font-medium">
      ✗ Not Opted In
    </p>
    <p className="text-xs text-gray-600">
      Opt in to ASA ID: {pool.assetId} to earn rewards
    </p>
  </div>
)}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#FF6B6B]">
                {pool.rewardRate.split(' ')[0]}
              </p>
              <p className="text-sm text-gray-600">per 1 USDC spent</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pool Available</span>
              <span className="font-medium">
                {(availableAmount / 1_000_000_000).toFixed(2)}B ({percentAvailable}%)
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
              <div 
                className={`h-full rounded-full ${pool.isOptedIn ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E]' : 'bg-gray-300'}`}
                style={{ 
                  width: `${percentAvailable}%` 
                }}
              />
            </div>
          </div>
        </div>
      );
    })}
    
    {/* Placeholder for future pools */}
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
      <p className="text-gray-500 mb-1">More Reward Pools Coming Soon</p>
      <p className="text-xs text-gray-400">Stay tuned for more ASA reward pools!</p>
    </div>
  </div>
)}
            
        </div>
        {/* Add Verification Modal */}
      {showVerificationModal && (
        <ImmersveVerificationModal
          fundAddress={fundAddress}
          rewardAddress={rewardAddress}
          onVerificationComplete={() => {
            setIsVerified(true);
            setShowVerificationModal(false);
            completeRegistration(); // Proceed with registration after verification
          }}
          onClose={() => setShowVerificationModal(false)}
        />
      )}

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