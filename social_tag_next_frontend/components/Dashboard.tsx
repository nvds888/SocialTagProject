"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { useRouter } from 'next/router'
import Confetti from 'react-confetti'
import { Twitter, Facebook, Linkedin, CheckCircle, Share2, Github, User, Settings, Wallet, ExternalLink, RefreshCw, SquareStack, CreditCard, Gift} from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import ImmersveRewardsModal from '@/components/ImmersveRewardsModal';
import SettingsPanel from './SettingsPanel'
import CustomizePanel from './CustomizePanel'
import { PeraWalletConnect } from "@perawallet/connect"
import { motion } from 'framer-motion'
import SpotifyIcon from '@/components/SpotifyIcon' 
import LavaEffect from '@/components/LavaEffect'
import VerificationDialog from '@/components/VerificationDialog'
import ReVerificationDialog from '@/components/ReVerificationDialog'
import Leaderboard from '@/components/Leaderboard'
import NFDSelectionModal from '@/components/NFDSelectionModal'
import { NFT, Verification } from '@/types/User'
import Image from 'next/image';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

// Create centralized API client with consistent configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

interface NFD {
  id: string;
  name: string;
  assetId?: string; // Add this line
}


interface ImmersveReward {
  assetId: number;
  amount: number;
  txId: string;
  timestamp: Date;
}

interface ImmersveTransaction {
  usdcAmount: number;
  timestamp: Date;
  txId: string;
  isInnerTx?: boolean;
  rewards: ImmersveReward[];
  processed: boolean;
}

interface SocialCardProps {
  platform: string;
  icon: React.ReactNode;
  isConnected: boolean;
  onConnect: () => void;
  username?: string;
  isVerified: boolean;
}

interface User {
  twitter?: { username: string };
  facebook?: { name: string };
  linkedin?: { name: string };
  github?: { username: string };
  spotify?: { id: string; username: string };
  theme?: string;
  cardStyle?: string;
  bio?: string;
  purchasedItems?: string[];
  profileImage?: string;
  profileViews?: number;
  nfd?: {
    id: string;
    name: string;
    assetId?: string;
  };
  profileNFT?: NFT;
  rewardPoints: number;
  verifications?: Verification[];
  reverifyCount: number;
  walletAddress?: string;
  saveWalletAddress?: boolean;
  immersveAddress?: string;
  immersveRewardAddress?: string;
}


const SocialCard: React.FC<SocialCardProps> = ({ platform, icon, isConnected, onConnect, username, isVerified }) => (
  <motion.div 
  className={`social-card ${isConnected ? 'connected' : ''} bg-white p-3 sm:p-4 rounded-lg flex items-center justify-between shadow-md w-full`}
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <div className="flex items-center">
      {icon}
      <span className="platform-name text-black ml-2">{platform}</span>
    </div>
    {isConnected ? (
      <div className="connected-info flex items-center">
        <CheckCircle size={20} className="text-green-500 mr-2" />
        <span className="text-sm text-gray-600">{username}</span>
      </div>
    ) : (
      <button 
        onClick={onConnect} 
        className={`connect-button bg-white text-black px-3 py-1 rounded-full text-sm hover:bg-opacity-80 transition-colors ${isVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={isVerified}
      >
        Connect
      </button>
    )}
  </motion.div>
)

const Dashboard: React.FC<Partial<{ username: string }>> = (props) => {
  const { username } = props;
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const { toast } = useToast()
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null)
  const [isCustomizePanelOpen, setIsCustomizePanelOpen] = useState(false)
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false)
  const [isReVerificationDialogOpen, setIsReVerificationDialogOpen] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showImmersveModal, setShowImmersveModal] = useState(false);
  const [socialBalance, setSocialBalance] = useState<string>('0');
  const [usdcBalance, setUsdcBalance] = useState<string>('0');
  const [recentTransactions, setRecentTransactions] = useState<ImmersveTransaction[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showNFDModal, setShowNFDModal] = useState(false)
const [nfds, setNfds] = useState<NFD[]>([])
const [selectedNFD, setSelectedNFD] = useState<NFD | null>(null)
const [isLoadingNFDs, setIsLoadingNFDs] = useState(false)
  const peraWallet = useMemo(() => {
    return typeof window !== 'undefined' ? new PeraWalletConnect() : null;
  }, []);

  const router = useRouter()

  // In Dashboard.tsx, update the fetchUser function
  const fetchUser = useCallback(async () => {
    if (!username) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/user/${username}`, { 
        withCredentials: true 
      });
      console.log('User data received:', response.data);
      setUser(response.data);
      
  
      if (response.data.verifications && response.data.verifications.length > 0) {
        setIsVerified(true);
      } else {
        setIsVerified(false);
      }
      
      setError(null);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (router.isReady && username) {
      fetchUser();
    }
  }, [router.isReady, username, fetchUser]);

  const handleFetchNFDs = async () => {
    if (!connectedAccount) {
      // Check if peraWallet exists
      if (!peraWallet) {
        toast({
          title: "Error",
          description: "Pera Wallet is not available.",
          variant: "destructive",
        });
        return;
      }
  
      try {
        const newAccounts = await peraWallet.connect();
        setConnectedAccount(newAccounts[0]);
        
        // After successful connection, fetch NFDs
        const response = await axios.get(`${API_BASE_URL}/peraWalletRoutes/fetch-wallet-nfds/${newAccounts[0]}`);
        setNfds(response.data);
        setShowNFDModal(true);
      } catch (error) {
        console.error('Error connecting wallet or fetching NFDs:', error);
        toast({
          title: "Connection Failed",
          description: "Please connect your Pera Wallet to fetch NFDs.",
          variant: "destructive",
        });
      }
    } else {
      // Wallet already connected, just fetch NFDs
      try {
        setIsLoadingNFDs(true);
        const response = await axios.get(`${API_BASE_URL}/peraWalletRoutes/fetch-wallet-nfds/${connectedAccount}`);
        setNfds(response.data);
        setShowNFDModal(true);
      } catch (error) {
        console.error('Error fetching NFDs:', error);
        toast({
          title: "Error",
          description: "Failed to fetch NFDs. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingNFDs(false);
      }
    }
  };
  
  const handleSelectNFD = async (nfd: NFD) => {
    if (!nfd || typeof nfd !== 'object') {
      setSelectedNFD(null);
      return;
    }
    
    const nfdData = {
      id: nfd.id?.toString() || 'unknown',
      name: nfd.name?.toString() || 'Unnamed NFD',
      assetId: nfd.assetId?.toString()
    };
    
    setSelectedNFD(nfdData);
    setShowNFDModal(false);
  
    try {
      await apiClient.post('/api/user/nfd', { nfd: nfdData });
      fetchUser(); // Refresh user data
    } catch (error) {
      console.error('Error updating NFD settings:', error);
      toast({
        title: "NFD Update Failed",
        description: "Failed to save NFD selection",
        variant: "destructive",
      });
    }
  };

  const fetchRecentTransactions = useCallback(async () => {
    if (!user?.immersveAddress) return;
    
    try {
      const response = await apiClient.get(`/api/immersveTransactions?address=${user.immersveAddress}`);
      setRecentTransactions(response.data.transactions.slice(0, 5)); // Only take latest 10
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, [user?.immersveAddress]);

  useEffect(() => {
    if (user?.immersveAddress) {
      fetchRecentTransactions();
    }
  }, [user?.immersveAddress, fetchRecentTransactions]);


  const handleDisconnectWalletClick = useCallback(async () => {
    if (peraWallet) {
      peraWallet.disconnect();
      setConnectedAccount(null);
    }
  }, [peraWallet]);



  const handleConnect = async (platform: string) => {
    // Check for both GitHub and Spotify
    if ((platform === 'github' || platform === 'spotify' || platform === 'linkedin' || platform === 'facebook') && user?.twitter?.username) {
      try {
        const response = await apiClient.post('/auth/create-linking-token', {
          twitterUsername: user.twitter.username,
          platform: platform.toLowerCase()  // This works for both 'github' and 'spotify'
        });
        const { token } = response.data;
        window.location.href = `${API_BASE_URL}/auth/${platform.toLowerCase()}?token=${token}`;
      } catch (error) {
        console.error(`Error creating linking token for ${platform}:`, error);
        toast({
          title: "Connection Error",
          description: `Failed to initiate ${platform} connection`,
          variant: "destructive",
        });
      }
    } else {
      // Original code for other platforms
      window.location.href = `${API_BASE_URL}/auth/${platform.toLowerCase()}`;
    }
  }


  const WalletPopoverContent = () => (
    <PopoverContent className="w-full bg-white border-2 border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0)] rounded-lg p-4 mt-2">
      <div className="flex flex-col space-y-3">
        <div className="border-b border-gray-200 pb-3">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Balances:</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold">{socialBalance}</span>
                <Image
                  src="/SocialTag.png"
                  alt="SocialTag"
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium"></span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold">{usdcBalance}</span>
                <Image
                  src="/usd-coin.png"
                  alt="USDC"
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={async () => {
            try {
              await apiClient.post('/api/user/wallet-settings', {
                saveWalletAddress: false,
                walletAddress: null
              });
              toast({
                title: "Opted out of rewards",
                description: "Your wallet address has been removed from the rewards program",
                duration: 3000,
              });
            } catch (error) {
              console.error('Error opting out:', error);
            }
          }}
          className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors rounded-lg text-red-500"
        >
          Opt out of rewards
        </button>
        <button
          onClick={handleDisconnectWalletClick}
          className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors rounded-lg"
        >
          Disconnect
        </button>
      </div>
    </PopoverContent>
  );

  const handleVerifyConfirm = () => {
    setIsVerificationDialogOpen(true);
  }

  const handleVerify = async () => {
    setVerifying(true);
    setIsVerificationDialogOpen(false);
    try {
      const response = await apiClient.post('/api/verify');
      console.log('Verification response:', response.data);
      setIsVerified(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      fetchUser();
    } catch (error) {
      console.error('Verification failed:', error);
      toast({
        title: "Verification Failed",
        description: "Please ensure at least two accounts are connected.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  }

  const handleReVerifyConfirm = () => {
    setIsReVerificationDialogOpen(true);
  }

  const handleReVerify = async () => {
    setIsReVerificationDialogOpen(false);
    try {
      const response = await apiClient.post('/api/re-verify');
      if (response.data.success) {
        setIsVerified(false);
        fetchUser();
        toast({
          title: "Re-verification Successful",
          description: "Your profile has been reset for re-verification.",
          duration: 3000,
        });
      } else {
        toast({
          title: "Re-verification Failed",
          description: response.data.message,
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Re-verification failed:', error);
      toast({
        title: "Re-verification Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  }

  const handleShareProfile = () => {
    if (typeof window !== 'undefined') {
      const profileUrl = `${window.location.origin}/socialtag/${user?.twitter?.username}`;
      navigator.clipboard.writeText(profileUrl).then(() => {
        toast({
          title: "Link Copied!",
          description: "Your profile link has been copied to the clipboard.",
          duration: 3000,
        });
      }).catch((err) => {
        console.error('Failed to copy link: ', err);
        toast({
          title: "Failed to copy link",
          description: "Please try again or copy the link manually.",
          variant: "destructive",
          duration: 3000,
        });
      });
    }
  }

  const handleOpenProfile = () => {
    if (typeof window !== 'undefined') {
      const profileUrl = `${window.location.origin}/socialtag/${user?.twitter?.username}`;
      window.open(profileUrl, '_blank');
    }
  }

  const handleConnectPera = async () => {
    if (peraWallet) {
      try {
        const newAccounts = await peraWallet.connect();
        setConnectedAccount(newAccounts[0]);
        fetchSocialBalance(newAccounts[0]); 
        
        if (user) {
          try {
            await apiClient.post('/api/user/wallet-settings', {
              saveWalletAddress: true, // Keep opted in
              walletAddress: newAccounts[0] // Update to new wallet
            });
            toast({
              title: "Opted in for rewards",
              description: "You've been automatically opted in for rewards. You can opt out anytime via your wallet button.",
              duration: 5000,
            });
          } catch (error) {
            console.error('Error setting wallet settings:', error);
          }
        }
      } catch (error) {
        console.error("Connection failed:", error);
      }
    }
  };

  const fetchSocialBalance = useCallback(async (address: string) => {
    if (!address) return;
    try {
      const response = await apiClient.get(`${API_BASE_URL}/social-balance?address=${address}`);
      if (response.data?.social) {
        setSocialBalance(response.data.social);
      }
      if (response.data?.usdc) {
        setUsdcBalance(response.data.usdc);
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
      setSocialBalance('0');
      setUsdcBalance('0');
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && peraWallet) {
      peraWallet.reconnectSession().then((accounts) => {
        peraWallet.connector?.on("disconnect", handleDisconnectWalletClick);
        
        if (accounts.length) {
          setConnectedAccount(accounts[0]);
          fetchSocialBalance(accounts[0]);
        }
      }).catch(e => console.log(e));

      return () => {
        peraWallet.connector?.off("disconnect");
      };
    }
  }, [peraWallet, fetchSocialBalance, handleDisconnectWalletClick]);

  const handleOpenLeaderboard = () => {
    setShowLeaderboard(true);
  }

  const handleCloseLeaderboard = () => {
    setShowLeaderboard(false);
  }

  const renderVerificationHistory = () => {
    if (!user?.verifications || user.verifications.length === 0) {
      return null;
    }
   
    const verification = user.verifications[0];
    return (
      <div className="flex items-center space-x-2 mb-6">
        <span className="text-black text-xl font-bold">Profile successfully verified!</span>
        <div className="group relative">
          <a 
            href={`https://explorer.perawallet.app/tx/${verification.algorandTransactionId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-500 hover:text-green-600 transition-colors"
          >
            <CheckCircle className="w-6 h-6" />
          </a>
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
            TX ID: {verification.algorandTransactionId?.substring(0, 10)}...
          </div>
        </div>
        <span className="text-white text-sm">
          {new Date(verification.timestamp).toLocaleString()}
        </span>
      </div>
    );
   };

  if (loading) {
    return <div className="loading text-black text-center py-20">Loading...</div>;
  }

  if (error) {
    return <div className="error text-red-500 text-center py-20">{error}</div>;
  }

  const isTwitterConnected = !!user?.twitter?.username;
  const isFacebookConnected = !!user?.facebook?.name;
  const isLinkedInConnected = !!user?.linkedin?.name;
  const isGitHubConnected = !!user?.github?.username;
  const isSpotifyConnected = !!user?.spotify?.username;
  const isNFDConnected = !!user?.nfd?.name;
  const connectedAccountsCount = [isTwitterConnected, isFacebookConnected, isLinkedInConnected, isGitHubConnected, isSpotifyConnected, isNFDConnected].filter(Boolean).length;
  const canVerify = connectedAccountsCount >= 2;

  return (
    <div className="min-h-screen bg-gray-100 text-black relative">
      {showConfetti && <Confetti />}
      <div className="relative z-10">
      <header className="flex flex-col sm:flex-row justify-between items-center p-4 sm:p-6 bg-white shadow-md gap-4">
          <h1 className="text-4xl font-bold">SocialTag</h1>
          <nav className="flex items-center flex-wrap justify-center gap-2 sm:gap-4">
          <Link 
  href="/" 
  className="bg-white text-black px-4 py-2 rounded-lg border-2 border-black hover:bg-gray-100 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0)] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
>
  Home
</Link>

<Button
  onClick={handleOpenLeaderboard}
  className="bg-white text-black px-4 py-2 rounded-lg border-2 border-black hover:bg-gray-100 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0)] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] flex items-center"
>
  Leaderboard
</Button>

<Button
disabled
  onClick={() => setShowImmersveModal(true)}
  className="bg-white text-black px-4 py-2 rounded-lg border-2 border-black hover:bg-black/10 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0)]"
>
  <Wallet size={18} className="mr-2" />
  Cashback Rewards
</Button>

<Button
  onClick={() => setIsCustomizePanelOpen(true)}
  className="bg-[#FFB951] text-black px-4 py-2 rounded-lg border-2 border-black hover:bg-[#FFB951]/90 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0)] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
>
  My Studio
</Button>

{!connectedAccount ? (
    <button
      onClick={handleConnectPera}
      className="bg-[#40E0D0] text-black px-4 py-2 rounded-lg border-2 border-black hover:bg-[#40E0D0]/90 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0)] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] flex items-center"
    >
      <Wallet size={18} className="mr-2" />
      Connect Pera
    </button>
  ) : (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className="bg-[#40E0D0] text-black px-4 py-2 rounded-lg border-2 border-black hover:bg-[#40E0D0]/90 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0)] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] flex items-center"
        >
          <Wallet size={18} className="mr-2" />
          {connectedAccount.substring(0, 4)}...{connectedAccount.substring(connectedAccount.length - 4)}
        </button>
      </PopoverTrigger>
      <WalletPopoverContent />
    </Popover>
  )}
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-black hover:text-gray-600 transition-colors">
                  <Settings size={24} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-white border-none text-black shadow-lg">
                {user && <SettingsPanel user={user} onSettingsUpdate={fetchUser} />}
              </PopoverContent>
            </Popover>
          </nav>
        </header>
        <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          <div className={`grid grid-cols-1 ${user?.immersveAddress ? 'lg:grid-cols-2 gap-8' : 'max-w-2xl mx-auto'}`}>
          <motion.div 
              initial={{ opacity: 0, x: user?.immersveAddress ? -20 : 0, y: user?.immersveAddress ? 0 : 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.5 }}
              className="dashboard-card bg-[#8B7AB4] rounded-lg p-3 sm:p-6 shadow-lg w-full max-w-2xl mx-auto"
          >
            {user?.twitter?.username && (
            <div className="profile-operator mb-6 bg-black p-4 rounded-lg relative overflow-hidden">
              <LavaEffect />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-bold text-white">Profile Operator</h2>
                  <div className="flex items-center bg-white px-3 py-1 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1 text-black">
                      <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 01-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004zM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 01-.921.42z" />
                      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.816a3.836 3.836 0 00-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 01-.921-.421l-.879-.66a.75.75 0 00-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 001.5 0v-.81a4.124 4.124 0 001.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 00-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 00.933-1.175l-.415-.33a3.836 3.836 0 00-1.719-.755V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-bold text-black">{user.rewardPoints}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <User size={20} className="mr-2 text-white" />
                  <span className="text-lg text-white">@{user.twitter.username}</span>
                </div>
              </div>
            </div>
            )}
             <div className="social-cards grid gap-1 mb-6">
              <SocialCard
                platform="X"
                icon={<Twitter size={24} className="text-black" />}
                isConnected={isTwitterConnected}
                onConnect={() => handleConnect('twitter')}
                username={user?.twitter?.username}
                isVerified={isVerified}
              />
              <SocialCard
  platform="NFDomain"
  icon={
    <Image 
      src="/nfdomain.png" 
      alt="NFDomain"
      width={24}
      height={24}
      className="dark:invert"
    />
  }
  isConnected={isNFDConnected}
  onConnect={handleFetchNFDs}
  username={user?.nfd?.name || ''}
  isVerified={isVerified}
/>
              <SocialCard
                platform="Facebook"
                icon={<Facebook size={24} className="text-black" />}
                isConnected={isFacebookConnected}
                onConnect={() => handleConnect('facebook')}
                username={user?.facebook?.name}
                isVerified={isVerified}
              />
              <SocialCard
                platform="LinkedIn"
                icon={<Linkedin size={24} className="text-black" />}
                isConnected={isLinkedInConnected}
                onConnect={() => handleConnect('linkedin')}
                username={user?.linkedin?.name}
                isVerified={isVerified}
              />
              <SocialCard
                platform="GitHub"
                icon={<Github size={24} className="text-black" />}
                isConnected={isGitHubConnected}
                onConnect={() => handleConnect('github')}
                username={user?.github?.username}
                isVerified={isVerified}
              />
              <SocialCard
                platform="Spotify"
                icon={<SpotifyIcon size={24} />}
                isConnected={isSpotifyConnected}
                onConnect={() => handleConnect('spotify')}
                username={user?.spotify?.username}
                isVerified={isVerified}
              />
            </div>
            {!isVerified && (
  <div className="flex justify-center w-full">
  <motion.button
    onClick={handleVerifyConfirm}
    className={`max-w-max bg-[#FF6B6B] text-black px-6 py-3 rounded-lg text-lg font-semibold hover:brightness-110 transition-all border-2 border-black shadow-md flex items-center justify-center ${canVerify ? '' : 'opacity-50 cursor-not-allowed'}`}
    disabled={!canVerify || verifying}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <RefreshCw size={16} className="mr-2" />
    {verifying ? 'Verifying...' : 'Verify Profile'}
  </motion.button>
</div>
)}
{isVerified && user?.verifications?.[0] && (
  <motion.div 
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
    className="verification-success mt-6 p-4 rounded-lg relative overflow-hidden bg-white-100"
  >
    {renderVerificationHistory()}
    <div className="action-buttons flex flex-col sm:flex-row gap-2 sm:space-x-4 relative z-10">
      <motion.button
        onClick={handleOpenProfile}
        className="flex-1 bg-[#FFB951] text-black px-4 py-2 rounded-lg flex items-center justify-center shadow-md hover:brightness-110 transition-all border-2 border-black"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ExternalLink size={16} className="mr-2" />
        Open
      </motion.button>
      <motion.button
        onClick={handleShareProfile}
        className="flex-1 bg-[#40E0D0] text-black px-4 py-2 rounded-lg flex items-center justify-center shadow-md hover:brightness-110 transition-all border-2 border-black"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Share2 size={16} className="mr-2" />
        Copy
      </motion.button>
      <motion.button
        onClick={handleReVerifyConfirm}
        disabled={(user?.reverifyCount ?? 0) >= 1}
        className={`flex-1 bg-[#FF6B6B] text-black px-4 py-2 rounded-lg flex items-center justify-center shadow-md hover:brightness-110 transition-all border-2 border-black
          ${(user?.reverifyCount ?? 0) >= 1 
            ? 'opacity-50 cursor-not-allowed' 
            : ''
          }`}
        whileHover={(user?.reverifyCount ?? 0) >= 1 ? {} : { scale: 1.05 }}
        whileTap={(user?.reverifyCount ?? 0) >= 1 ? {} : { scale: 0.95 }}
        title={(user?.reverifyCount ?? 0) >= 1 ? "You've already used your re-verification" : "Re-verify your profile"}
      >
        <RefreshCw size={16} className="mr-2" />
        {(user?.reverifyCount ?? 0) >= 1 ? 'Re-verify' : 'Re-verify'}
      </motion.button>
    </div>
           </motion.div>
            )}
            
            </motion.div>
          {/* Right Column - Only shows if user has Immersve address */}
          {user?.immersveAddress && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-5"
            >
              {/* Cashback Stats */}
              <div className="bg-white p-6 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0)]">
                <h3 className="text-xl font-bold mb-6">Payment Dashboard</h3>
                <div className="grid gap-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <CreditCard className="w-6 h-6 text-black" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Total USDC Spent</p>
                      <p className="text-2xl font-bold text-black">
                        ${recentTransactions.reduce((sum, tx) => sum + (tx.usdcAmount || 0), 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <SquareStack className="w-6 h-6 text-black" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Highest Payment</p>
                      <p className="text-2xl font-bold text-black">
                        ${recentTransactions.length > 0 
                          ? Math.max(...recentTransactions.map(tx => tx.usdcAmount || 0)).toFixed(2)
                          : '0.00'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
  <div className="p-2 bg-gray-50 rounded-lg">
    <Gift className="w-6 h-6 text-black" />
  </div>
  <div className="flex-1">
    <p className="text-sm font-medium text-gray-600">Earned Cashback</p>
    {(() => {
      const rewardsMap = recentTransactions.reduce((acc, tx) => {
        tx.rewards?.forEach(reward => {
          const key = reward.assetId === 2607097066 ? 'SOCIALS' : `ASA-${reward.assetId}`;
          acc[key] = (acc[key] || 0) + (reward.amount || 0);
        });
        return acc;
      }, {} as Record<string, number>);

      return Object.keys(rewardsMap).length > 0 ? (
        <div className="flex flex-col gap-2 mt-1">
          <div className="flex items-center gap-3">
            <p className="text-2xl font-bold text-[#40E0D0]">
              {(rewardsMap['SOCIALS'] / 1_000_000_000_000).toFixed(2)}M
            </p>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Image
                src="/SocialTag.png"
                alt="SOCIALS"
                width={16}
                height={16}
                className="rounded-full"
              />
              <span>SOCIALS</span>
            </div>
          </div>
          {/* Future reward pools will be added here automatically */}
        </div>
      ) : (
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-2">
            <p className="text-lg font-medium">
              0B
            </p>
            <div className="flex items-center gap-1">
              <Image
                src="/SocialTag.png"
                alt="SOCIALS"
                width={16}
                height={16}
                className="rounded-full"
              />
              <span className="text-sm text-gray-500">SOCIALS</span>
            </div>
          </div>
        </div>
      );
    })()}
  </div>
</div>
                </div>
              </div>

              {/* Recent Payments */}
              <div className="bg-white p-6 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0)]">
                <h3 className="text-xl font-bold mb-4">Recent Payments</h3>
                <div className="space-y-2">
                  {recentTransactions.length > 0 ? (
                    recentTransactions
                      .slice(0, 5)
                      .map((tx, index) => (
                        <div 
                          key={index}
                          className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium">
                                ${tx.usdcAmount.toFixed(2)} USDC
                                {tx.isInnerTx && <span className="text-xs text-gray-500 ml-1">(Inner TX)</span>}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(tx.timestamp).toLocaleDateString()}
                              </p>
                              {tx.rewards.map((reward, rIndex) => (
                                <p key={rIndex} className="text-xs text-[#40E0D0] mt-1">
                                  +{(reward.amount / 1_000_000_000_000).toFixed(2)}M {' '}
                                  {reward.assetId === 2607097066 ? 'SOCIALS' : 'MEEP'}
                                </p>
                              ))}
                            </div>
                            <div className="flex flex-col gap-1">
                              <a
                                href={`https://explorer.perawallet.app/tx/${tx.txId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[#FF6B6B] hover:underline"
                              >
                                Payment
                              </a>
                              {tx.rewards.map((reward, rIndex) => (
                                <a
                                  key={rIndex}
                                  href={`https://explorer.perawallet.app/tx/${reward.txId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-[#40E0D0] hover:underline"
                                >
                                  Reward {rIndex + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-gray-500 text-center">No recent payments</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
        </main>
      </div>
      {user && (
  <CustomizePanel
    isOpen={isCustomizePanelOpen}
    onClose={() => setIsCustomizePanelOpen(false)}
    user={user}
    onSettingsUpdate={fetchUser}
    connectedWalletAddress={connectedAccount}
  />
)}
      <VerificationDialog
        isOpen={isVerificationDialogOpen}
        onClose={() => setIsVerificationDialogOpen(false)}
        onConfirm={handleVerify}
      />
      <ReVerificationDialog
        isOpen={isReVerificationDialogOpen}
        onClose={() => setIsReVerificationDialogOpen(false)}
        onConfirm={handleReVerify}
      />
      <NFDSelectionModal
  isOpen={showNFDModal}
  onClose={() => setShowNFDModal(false)}
  nfds={nfds}
  selectedNFD={selectedNFD}
  onSelectNFD={handleSelectNFD}
  isLoading={isLoadingNFDs}
/>
      <Leaderboard isOpen={showLeaderboard} onClose={handleCloseLeaderboard} />
      {user && (
  <ImmersveRewardsModal
    isOpen={showImmersveModal}
    onClose={() => setShowImmersveModal(false)}
    user={user}
    connectedWalletAddress={connectedAccount}
    onRegistrationSuccess={async () => {
      await fetchUser();
      await fetchRecentTransactions();
    }} 
    />
  )}
      <Toaster />
    </div>
  )
}

export default Dashboard
