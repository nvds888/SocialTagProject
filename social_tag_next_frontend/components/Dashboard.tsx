"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { useRouter } from 'next/router'
import Confetti from 'react-confetti'
import { Twitter, Facebook, Linkedin, CheckCircle, Share2, Clock, Hash, Github, User, Settings, Wallet, ExternalLink, RefreshCw, SquareStack} from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import SettingsPanel from './SettingsPanel'
import CustomizePanel from './CustomizePanel'
import { PeraWalletConnect } from "@perawallet/connect"
import { motion } from 'framer-motion'
import SpotifyIcon from '@/components/SpotifyIcon' 
import LavaEffect from '@/components/LavaEffect'
import VerificationDialog from '@/components/VerificationDialog'
import ReVerificationDialog from '@/components/ReVerificationDialog'
import Leaderboard from '@/components/Leaderboard'
import { NFT, Verification } from '@/types/User'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

// Create centralized API client with consistent configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

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
  nfd?: string;
  profileNFT?: NFT;
  rewardPoints: number;
  verifications?: Verification[];
  reverifyCount: number;
  walletAddress?: string;
  saveWalletAddress?: boolean;
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
  const [socialBalance, setSocialBalance] = useState<string>('0');
  const [showLeaderboard, setShowLeaderboard] = useState(false)
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
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Socials Balance</span>s
            <span className="text-sm font-bold">{socialBalance} $SOCIALS</span>
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
      if (response.data?.balance) {
        setSocialBalance(response.data.balance);
      }
    } catch (error) {
      console.error('Error fetching social balance:', error);
      setSocialBalance('0');
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
      return <p className="text-gray-200">...</p>;
    }

    return (
      <ul className="space-y-2">
        {user.verifications.map((verification, index) => (
          <li key={index} className={`p-2 rounded-lg ${verification.isPermanentafy ? 'bg-[#FF6B6B]' : 'bg-gray-100'}`}>
            <div className="flex items-center text-gray-700">
              <Clock size={16} className="mr-2" />
              {new Date(verification.timestamp).toLocaleString()}
            </div>
            <div className="flex items-center text-gray-700">
              <Hash size={16} className="mr-2" />
              <a 
                href={`https://explorer.perawallet.app/tx/${verification.algorandTransactionId}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {verification.algorandTransactionId?.substring(0, 10)}...
              </a>
            </div>
            {verification.isPermanentafy && (
              <div className="mt-1 text-xs text-green-600">Permanentafied</div>
            )}
            {verification.assetId && (
              <div className="mt-1 text-xs text-blue-600">Asset ID: {verification.assetId}</div>
            )}
          </li>
        ))}
      </ul>
    );
  }

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
  const connectedAccountsCount = [isTwitterConnected, isFacebookConnected, isLinkedInConnected, isGitHubConnected, isSpotifyConnected].filter(Boolean).length;
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
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="dashboard-card bg-[#8B7AB4] rounded-lg p-3 sm:p-6 shadow-lg max-w-2xl mx-auto w-full"
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
{!canVerify && !isVerified && (
  <p className="mt-4 text-gray-200 text-center">Connect at least two accounts to verify your profile.</p>
)}
           {isVerified && (
  <motion.div 
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
    className="verification-success mt-6 p-4 rounded-lg relative overflow-hidden bg-white-100"
  >
    <div className="success-message flex items-center mb-4 relative z-4">
      <SquareStack size={30} className="text-[#40E0D0] mr-2" />
      <span className="text-black text-xl font-bold">Profile successfully verified!</span>
    </div>
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
            <div className="mt-2">
              <h3 className="text-xl font-bold mb-4">Verification</h3>
              {renderVerificationHistory()}
            </div>
          </motion.div>
        </main>
      </div>
      <CustomizePanel
        isOpen={isCustomizePanelOpen}
        onClose={() => setIsCustomizePanelOpen(false)}
        user={user as User}
        onSettingsUpdate={fetchUser}
        connectedWalletAddress={connectedAccount}
      />
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
      <Leaderboard isOpen={showLeaderboard} onClose={handleCloseLeaderboard} />
      <Toaster />
    </div>
  )
}

export default Dashboard
