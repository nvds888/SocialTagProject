"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from 'axios';
import { useToast } from "@/components/ui/use-toast";

interface Transaction {
  timestamp: string;
  amount: number;
  transactionId: string;
  rewards: {
    amount: number;
    tokenSymbol: string;
    distributionTxId: string;
  }[];
}

interface User {
  twitter?: {
    username: string;
  };
  walletAddress?: string;
}

interface ImmersveRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  connectedWalletAddress: string | null;
}

interface RewardsData {
  fundAddress: string;
  rewardAddress: string;
  transactions: Transaction[];
}

interface RegistrationStatus {
  isRegistered: boolean;
  openTab: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const ImmersveRewardsModal: React.FC<ImmersveRewardsModalProps> = ({
  isOpen,
  onClose,
  user,
  connectedWalletAddress
}) => {
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>({
    isRegistered: false,
    openTab: null
  });
  const [fundAddress, setFundAddress] = useState<string>('');
  const [rewardAddress, setRewardAddress] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && user?.twitter?.username) {
      fetchRewardsData();
    }
  }, [isOpen, user]);

  const fetchRewardsData = async () => {
    if (!user.twitter?.username) return;
    
    try {
      const response = await axios.get<RewardsData>(
        `${API_BASE_URL}/api/immersve/rewards/${user.twitter.username}`
      );
      
      if (response.data) {
        setRegistrationStatus(prev => ({ ...prev, isRegistered: true }));
        setFundAddress(response.data.fundAddress);
        setRewardAddress(response.data.rewardAddress);
        setTransactions(response.data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching rewards data:', error);
      setError('Failed to fetch rewards data');
    }
  };

  const handleRegistration = async () => {
    if (!fundAddress || !rewardAddress) {
      toast({
        title: "Missing Information",
        description: "Please provide both addresses",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/immersve/register`, {
        fundAddress,
        rewardAddress: rewardAddress || connectedWalletAddress
      });
      
      setRegistrationStatus(prev => ({ ...prev, isRegistered: true }));
      toast({
        title: "Registration Successful",
        description: "You're now registered for Immersve rewards!",
      });
      
      await fetchRewardsData();
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTab = (tabName: string) => {
    setRegistrationStatus(prev => ({
      ...prev,
      openTab: prev.openTab === tabName ? null : tabName
    }));
  };

  const calculateTotalSpent = (): number => {
    return transactions.reduce((sum, tx) => sum + tx.amount, 0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white p-6 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold text-black">Immersve Rewards</h1>
              <div className="flex items-center space-x-8">
                <span className="text-xs font-medium text-gray-600">Total USDC Spent:</span>
                <span className="text-lg font-bold text-black">
                  ${calculateTotalSpent().toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Registration Section */}
              <div>
                <Button
                  onClick={() => toggleTab('register')}
                  className="w-full flex justify-between items-center py-2 px-4"
                  variant="outline"
                >
                  <span>Register Addresses</span>
                  {registrationStatus.openTab === 'register' ? <ChevronUp /> : <ChevronDown />}
                </Button>
                <AnimatePresence>
                  {registrationStatus.openTab === 'register' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-4 p-4 border-2 border-black rounded-lg">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-black">Immersve Fund Address</label>
                          <Input
                            value={fundAddress}
                            onChange={(e) => setFundAddress(e.target.value)}
                            placeholder="Enter your fund contract address"
                            className="border-2 border-black"
                            disabled={registrationStatus.isRegistered}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-black">Reward Receiving Address</label>
                          <Input
                            value={rewardAddress || connectedWalletAddress || ''}
                            onChange={(e) => setRewardAddress(e.target.value)}
                            placeholder="Enter address to receive rewards"
                            className="border-2 border-black"
                            disabled={!!connectedWalletAddress || registrationStatus.isRegistered}
                          />
                        </div>
                        <Button
                          onClick={handleRegistration}
                          disabled={loading || !fundAddress || !(rewardAddress || connectedWalletAddress) || registrationStatus.isRegistered}
                          className="w-full bg-[#FF6B6B] text-black hover:bg-[#FF6B6B]/90 border-2 border-black"
                        >
                          {loading ? 'Registering...' : (registrationStatus.isRegistered ? 'Registered' : 'Register')}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Transactions Section */}
              <div>
                <Button
                  onClick={() => toggleTab('transactions')}
                  className="w-full flex justify-between items-center py-2 px-4"
                  variant="outline"
                >
                  <span>Payment History</span>
                  {registrationStatus.openTab === 'transactions' ? <ChevronUp /> : <ChevronDown />}
                </Button>
                <AnimatePresence>
                  {registrationStatus.openTab === 'transactions' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-4">
                        {transactions.map((tx, index) => (
                          <div key={index} className="p-4 border-2 border-black rounded-lg bg-white">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm text-gray-600">
                                  {new Date(tx.timestamp).toLocaleDateString()}
                                </p>
                                <p className="font-bold text-black">${tx.amount} USDC</p>
                              </div>
                              <div className="flex flex-col items-end">
                                {tx.rewards?.map((reward, idx) => (
                                  <span key={idx} className="text-green-600 font-medium">
                                    +{reward.amount} {reward.tokenSymbol}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                        {transactions.length === 0 && (
                          <div className="text-center text-gray-500 py-4">
                            No transactions yet
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <Button
                onClick={onClose}
                className="bg-white text-black hover:bg-gray-100 border-2 border-black"
              >
                Close
              </Button>
            </div>

            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImmersveRewardsModal;