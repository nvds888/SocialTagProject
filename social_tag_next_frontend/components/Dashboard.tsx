"use client";

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import Confetti from 'react-confetti'
import { Twitter, Facebook, Linkedin, CheckCircle, Share2, Clock, Hash, Github, User, Settings, Wallet, ExternalLink, Trophy, RefreshCw } from 'lucide-react'
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
import NotificationMessage from '@/components/NotificationMessage'
import Leaderboard from '@/components/Leaderboard'

axios.defaults.withCredentials = true

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const peraWallet = new PeraWalletConnect();

interface SocialCardProps {
  platform: string;
  icon: React.ReactNode;
  isConnected: boolean;
  onConnect: () => void;
  username?: string;
  isVerified: boolean;
}

const SocialCard: React.FC<SocialCardProps> = ({ platform, icon, isConnected, onConnect, username, isVerified }) => (
  <motion.div 
    className={`social-card ${isConnected ? 'connected' : ''} bg-white p-4 rounded-lg flex items-center justify-between shadow-md`}
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

interface User {
  twitter?: { username: string };
  facebook?: { name: string };
  linkedin?: { name: string };
  github?: { username: string };
  spotify?: { id: string; username: string };
  verifications: Verification[];
  theme?: string;
  rewardPoints: number;
}

interface Verification {
  timestamp: string;
  algorandTransactionId?: string;
  isPermanentafy?: boolean;
  assetId?: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null)
  const [isCustomizePanelOpen, setIsCustomizePanelOpen] = useState(false)
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false)
  const [isReVerificationDialogOpen, setIsReVerificationDialogOpen] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/api/user`)
      console.log('User data received:', response.data)
      setUser(response.data)
      setIsVerified(response.data.verifications && response.data.verifications.length > 0)
      setError(null)
    } catch (error) {
      console.error('Error fetching user data:', error)
      setError('Failed to load user data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  useEffect(() => {
    if (!searchParams) return;
    const authStatus = searchParams.get('auth_status')
    const platform = searchParams.get('platform')

    if (authStatus === 'success' && platform) {
      fetchUser()
    }
  }, [fetchUser, searchParams])

  useEffect(() => {
    peraWallet.reconnectSession().then((accounts) => {
      peraWallet.connector?.on("disconnect", handleDisconnectWalletClick);

      if (accounts.length) {
        setConnectedAccount(accounts[0]);
      }
    }).catch(e => console.log(e));

    return () => {
      peraWallet.connector?.off("disconnect", handleDisconnectWalletClick);
    };
  }, []);

  const handleConnect = (platform: string) => {
    window.location.href = `${API_BASE_URL}/auth/${platform.toLowerCase()}`;
  }

  const handleVerifyConfirm = () => {
    setIsVerificationDialogOpen(true)
  }

  const handleVerify = async () => {
    setVerifying(true)
    setIsVerificationDialogOpen(false)
    try {
      const response = await axios.post(`${API_BASE_URL}/api/verify`)
      console.log('Verification response:', response.data)
      setIsVerified(true)
      setShowNotification(true)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 5000)
      fetchUser()
    } catch (error) {
      console.error('Verification failed:', error)
      toast({
        title: "Verification Failed",
        description: "Please ensure at least two accounts are connected.",
        variant: "destructive",
      })
    } finally {
      setVerifying(false)
    }
  }

  const handleReVerifyConfirm = () => {
    setIsReVerificationDialogOpen(true)
  }

  const handleReVerify = async () => {
    setIsReVerificationDialogOpen(false)
    try {
      const response = await axios.post(`${API_BASE_URL}/api/re-verify`)
      if (response.data.success) {
        setIsVerified(false)
        setShowNotification(true)
        fetchUser()
        toast({
          title: "Re-verification Successful",
          description: "Your profile has been reset for re-verification.",
          duration: 3000,
        })
      } else {
        toast({
          title: "Re-verification Failed",
          description: response.data.message,
          variant: "destructive",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Re-verification failed:', error)
      toast({
        title: "Re-verification Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/socialtag/${user?.twitter?.username}`
    navigator.clipboard.writeText(profileUrl).then(() => {
      toast({
        title: "Link Copied!",
        description: "Your profile link has been copied to the clipboard.",
        duration: 3000,
      })
    }).catch((err) => {
      console.error('Failed to copy link: ', err)
      toast({
        title: "Failed to copy link",
        description: "Please try again or copy the link manually.",
        variant: "destructive",
        duration: 3000,
      })
    })
  }

  const handleOpenProfile = () => {
    const profileUrl = `${window.location.origin}/socialtag/${user?.twitter?.username}`
    window.open(profileUrl, '_blank')
  }

  const handleConnectPera = async () => {
    if (peraWallet) {
      try {
        const newAccounts = await peraWallet.connect()
        setConnectedAccount(newAccounts[0])
      } catch (error) {
        console.error("Connection failed:", error)
      }
    }
  }

  const handleDisconnectWalletClick = useCallback(() => {
    peraWallet.disconnect();
    setConnectedAccount(null);
  }, []);

  const handleOpenLeaderboard = () => {
    setShowLeaderboard(true)
  }

  const handleCloseLeaderboard = () => {
    setShowLeaderboard(false)
  }

  const renderVerificationHistory = () => {
    if (!user?.verifications || user.verifications.length === 0) {
      return <p className="text-gray-500">No verification history available.</p>
    }

    return (
      <ul className="space-y-2">
        {user.verifications.map((verification, index) => (
          <li key={index} className={`p-2 rounded-lg ${verification.isPermanentafy ? 'bg-green-100' : 'bg-gray-100'}`}>
            <div className="flex items-center text-gray-700">
              <Clock size={16} className="mr-2" />
              {new Date(verification.timestamp).toLocaleString()}
            </div>
            <div className="flex items-center text-gray-700">
              <Hash size={16} className="mr-2" />
              <a 
                href={`https://testnet.explorer.perawallet.app/tx/${verification.algorandTransactionId}`} 
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
    )
  }

  if (loading) {
    return <div className="loading text-black text-center py-20">Loading...</div>
  }

  if (error) {
    return <div className="error text-red-500 text-center py-20">{error}</div>
  }

  const isTwitterConnected = !!user?.twitter?.username
  const isFacebookConnected = !!user?.facebook?.name
  const isLinkedInConnected = !!user?.linkedin?.name
  const isGitHubConnected = !!user?.github?.username
  const isSpotifyConnected = !!user?.spotify?.username
  const connectedAccountsCount = [isTwitterConnected, isFacebookConnected, isLinkedInConnected, isGitHubConnected, isSpotifyConnected].filter(Boolean).length
  const canVerify = connectedAccountsCount >= 2

  return (
    <div className="min-h-screen bg-gray-100 text-black relative">
      {showConfetti && <Confetti />}
      <div className="relative z-10">
        <header className="flex justify-between items-center p-6 bg-white shadow-md">
          <h1 className="text-4xl font-bold">SocialTag</h1>
          <nav className="flex items-center space-x-4">
            <Link href="/" className="bg-white text-black px-4 py-2 rounded-full hover:bg-white transition-colors">Home</Link>
            <Button
              onClick={() => setIsCustomizePanelOpen(true)}
              className="bg-white text-black px-4 py-2 rounded-full hover:bg-white transition-colors"
            >
              Mission Control
            </Button>
            <Button
              onClick={handleOpenLeaderboard}
              className="bg-white text-black px-4 py-2 rounded-full hover:bg-white transition-colors flex items-center"
            >
              <Trophy size={18} className="mr-2" />
              Leaderboard
            </Button>
            {!connectedAccount ? (
              <button 
                onClick={handleConnectPera}
                className="bg-white text-black px-4 py-2 rounded-full hover:bg-green-100 transition-colors flex items-center"
              >
                <Wallet size={18} className="mr-2" />
                Connect Pera
              </button>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="bg-green-100 text-black px-4 py-2 rounded-full hover:bg-green-100 transition-colors flex items-center">
                    <Wallet size={18} className="mr-2" />
                    {connectedAccount.substring(0, 4)}...{connectedAccount.substring(connectedAccount.length - 4)}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-full bg-white border-none text-black shadow-lg">
                  <button 
                    onClick={handleDisconnectWalletClick}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    Disconnect
                  </button>
                </PopoverContent>
              </Popover>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-black hover:text-gray-600 transition-colors">
                  <Settings size={24} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-white border-none text-black shadow-lg">
                <SettingsPanel user={user} onSettingsUpdate={fetchUser} />
              </PopoverContent>
            </Popover>
          </nav>
        </header>
        <main className="container mx-auto px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="dashboard-card bg-purple-300 rounded-lg p-6 shadow-lg max-w-2xl mx-auto"
          >
            {user?.twitter?.username && (
              <div className="profile-operator mb-6 bg-black p-4 rounded-lg relative overflow-hidden">
                <LavaEffect />
                <div className="relative z-10">
                  <h2 className="text-xl font-bold mb-2 text-white">Profile Operator</h2>
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
                icon={<SpotifyIcon size={24} className="text-black" />}
                isConnected={isSpotifyConnected}
                onConnect={() => handleConnect('spotify')}
                username={user?.spotify?.username}
                isVerified={isVerified}
              />
            </div>
            {!isVerified && (
              <motion.button 
                onClick={handleVerifyConfirm} 
                className={`w-full bg-transparent text-black px-6 py-3 rounded-lg text-lg font-semibold hover:bg-green-100 transition-colors relative overflow-hidden ${canVerify ? '' : 'opacity-50 cursor-not-allowed'}`}
                disabled={!canVerify || verifying}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {verifying ? 'Verifying...' : 'Verify Profile'}
              </motion.button>
            )}
            {!canVerify && !isVerified && (
              <p className="mt-4 text-red-400 text-center">Connect at least two accounts to verify your profile.</p>
            )}
            {isVerified && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="verification-success mt-6 p-4 rounded-lg relative overflow-hidden bg-white-100"
              >
                <div className="success-message flex items-center mb-4 relative z-4">
                  <CheckCircle size={26} className="text-green-500 mr-2" />
                  <span className="text-black text-xl font-bold">Profile successfully verified!</span>
                </div>
                <div className="action-buttons flex space-x-4 relative z-10">
                  <motion.button
                    onClick={handleOpenProfile}
                    className="flex-1 bg-transparent backdrop-filter backdrop-blur-sm bg-opacity-20 border border-white text-black px-4 py-2 rounded-l-lg flex items-center justify-center hover:bg-white hover:bg-opacity-30 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ExternalLink size={16} className="mr-2" />
                    Open
                  </motion.button>
                  <motion.button
                    onClick={handleShareProfile}
                    className="flex-1 bg-transparent backdrop-filter backdrop-blur-sm bg-opacity-20 border border-white text-black px-4 py-2 flex items-center justify-center hover:bg-white hover:bg-opacity-30 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Share2 size={16} className="mr-2" />
                    Copy
                  </motion.button>
                  <motion.button
                    onClick={handleReVerifyConfirm}
                    className="flex-1 bg-transparent backdrop-filter backdrop-blur-sm bg-opacity-20 border border-white text-black px-4 py-2 rounded-r-lg flex items-center justify-center hover:bg-white hover:bg-opacity-30 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Re-verify
                  </motion.button>
                </div>
              </motion.div>
            )}
            <div className="mt-2">
              <h3 className="text-xl font-bold mb-4">Verification Hash</h3>
              {renderVerificationHistory()}
            </div>
          </motion.div>
        </main>
      </div>
      <CustomizePanel
        isOpen={isCustomizePanelOpen}
        onClose={() => setIsCustomizePanelOpen(false)}
        user={user}
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
