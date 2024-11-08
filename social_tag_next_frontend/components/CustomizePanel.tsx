"use client";

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import algosdk from 'algosdk';
import { PeraWalletConnect } from '@perawallet/connect';
import { Info, ChevronDown, ChevronUp, ExternalLink, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import SocialTagBackground from '@/components/SocialTagBackground'
import ArcticIceBackground from '@/components/ArcticIceBackground'
import TropicalIslandBackground from '@/components/TropicalIslandBackground'
import AlienLandscapeBackground from '@/components/AlienLandscapeBackground'
import BubbleTeaPartyBackground from '@/components/BubbleTeaPartyBackground'
import NeonCitySkyline from '@/components/NeonCitySkyline'
import SpaceOdysseyStargate from '@/components/SpaceOdysseyStargate'
import RetroWaveBackground from '@/components/RetroWaveBackground'
import ElectricPlasma from '@/components/ElectricPlasma'
import AbstractDataFlow from '@/components/AbstractDataFlow'
import NFTicketBackground from '@/components/NFTicketBackground'
import SustainableCoffeeBackground from '@/components/SustainableCoffeeBackground'
import FourOrangesCard from '@/components/FourOrangesCard'
import OrangeMemeBackground from '@/components/OrangeMemeBackground'
import NeutralCard from '@/components/NeutralCard'
import PeraWalletBackground from '@/components/PeraWalletBackground'
import DefaultCard from '@/components/ProfileCard'
import FrostedGlassCard from '@/components/frosted-glass-card'
import HolographicCard from '@/components/holographic-card'
import Confetti from 'react-confetti'
import NFTSelectionModal from '@/components/NFTSelectionModal'
import NFDSelectionModal from '@/components/NFDSelectionModal'
import { User } from '@/types/User'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'
const peraWallet = new PeraWalletConnect();

interface CustomizePanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSettingsUpdate: () => void;
  connectedWalletAddress: string | null;
}

interface NFT {
  id: string;
  name: string;
  url?: string;
  'metadata-hash'?: string;
  reserve?: string;
  image?: string;
  assetId?: string;
}

interface NFD {
  id: string;
  name: string;
  assetId?: string;
}

interface ComponentProps {
  user?: User;
  theme?: string;
  cardStyle?: string;
}

interface ThemeItem {
  name: string;
  component: React.FC<ComponentProps>;
  premium: boolean;
  specialEdition?: boolean;
  requiredPoints?: number;
}

interface CardStyleItem {
  name: string;
  component: React.FC<ComponentProps>;
  premium: boolean;
  specialEdition?: boolean;
  requiredPoints?: number;
}

interface ProfileCardProps extends ComponentProps {
}

const themes: ThemeItem[] = [
  { name: 'SocialTag', component: SocialTagBackground, premium: false },
  { name: 'ArcticIce', component: ArcticIceBackground, premium: false },
  { name: 'TropicalIsland', component: TropicalIslandBackground, premium: false },
  { name: 'AlienLandscape', component: AlienLandscapeBackground, premium: true },
  { name: 'BubbleTeaParty', component: BubbleTeaPartyBackground, premium: true },
  { name: 'NeonCitySkyline', component: NeonCitySkyline, premium: true },
  { name: 'SpaceOdysseyStargate', component: SpaceOdysseyStargate, premium: true },
  { name: 'RetroWave', component: RetroWaveBackground, premium: true },
  { name: 'ElectricPlasma', component: ElectricPlasma, premium: true },
  { name: 'AbstractDataFlow', component: AbstractDataFlow, premium: true },
  { name: 'PeraWallet', component: PeraWalletBackground, premium: false, specialEdition: true, requiredPoints: 300 },
  { name: 'NFTicket', component: NFTicketBackground, premium: false, specialEdition: true, requiredPoints: 600 },
  { name: 'SustainableCoffee', component: SustainableCoffeeBackground, premium: false, specialEdition: true, requiredPoints: 700 },
  { name: 'OrangeMeme', component: OrangeMemeBackground, premium: false, specialEdition: true, requiredPoints: 1000 }
]

const cardStyles: CardStyleItem[] = [
  { name: 'Default', component: DefaultCard as React.FC<ProfileCardProps>, premium: false },
  { name: 'Neutral', component: NeutralCard as React.FC<ProfileCardProps>, premium: false },
  { name: 'Frosted Glass', component: FrostedGlassCard as React.FC<ProfileCardProps>, premium: true },
  { name: 'Holographic', component: HolographicCard as React.FC<ProfileCardProps>, premium: true },
  { name: 'Four Oranges', component: FourOrangesCard as React.FC<ProfileCardProps>, premium: false, specialEdition: true, requiredPoints: 600 },
]

const CustomizePanel: React.FC<CustomizePanelProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  onSettingsUpdate,
  connectedWalletAddress
}) => {
  // UI States with localStorage
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(`theme_${user.twitter?.username}`) || 'SocialTag'
  });
  
  const [cardStyle, setCardStyle] = useState(() => {
    return localStorage.getItem(`cardStyle_${user.twitter?.username}`) || 'Default'
  });

  const [openTab, setOpenTab] = useState<string | null>(() => {
    return localStorage.getItem(`openTab_${user.twitter?.username}`) || null
  });

  // Server-dependent States
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [selectedNFD, setSelectedNFD] = useState<NFD | null>(null);
  const [bio, setBio] = useState('');
  const [profileViews, setProfileViews] = useState(0);

  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ type: 'theme' | 'cardStyle', name: string } | null>(null);
  const [processingPaymentType, setProcessingPaymentType] = useState<'USDC' | 'ORA' | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Modal States
  const [showNFTModal, setShowNFTModal] = useState(false);
  const [showNFDModal, setShowNFDModal] = useState(false);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const [isLoadingNFDs, setIsLoadingNFDs] = useState(false);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [nfds, setNfds] = useState<NFD[]>([]);

  const { toast } = useToast();

  // Save UI preferences to localStorage whenever they change
  useEffect(() => {
    if (user.twitter?.username) {
      localStorage.setItem(`openTab_${user.twitter.username}`, openTab || '');
      localStorage.setItem(`theme_${user.twitter.username}`, theme);
      localStorage.setItem(`cardStyle_${user.twitter.username}`, cardStyle);
    }
  }, [openTab, theme, cardStyle, user.twitter?.username]);

  // Fetch server data when panel opens
  useEffect(() => {
    const fetchServerData = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/user`, { 
          withCredentials: true 
        });
        const userData = response.data;
        
        // Update server-dependent states
        setPurchasedItems(userData.purchasedItems || []);
        setBio(userData.bio || '');
        setProfileViews(userData.profileViews || 0);
        setSelectedNFT(userData.profileNFT);
        setSelectedNFD(userData.nfd);
        
        // Update local cache only if server data is different
        if (userData.theme !== theme) {
          setTheme(userData.theme);
          localStorage.setItem(`theme_${user.twitter?.username}`, userData.theme);
        }
        
        if (userData.cardStyle !== cardStyle) {
          setCardStyle(userData.cardStyle);
          localStorage.setItem(`cardStyle_${user.twitter?.username}`, userData.cardStyle);
        }

        // Fetch reward points
        const pointsResponse = await axios.get(`${API_BASE_URL}/api/user/reward-points`, { 
          withCredentials: true 
        });
        setRewardPoints(pointsResponse.data.rewardPoints);

      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: "Error",
          description: "Failed to load your settings. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchServerData();
  }, [isOpen, theme, cardStyle, user.twitter?.username, toast]);

  const handleItemSelection = (itemType: 'theme' | 'cardStyle', itemName: string) => {
    const selectedItem = itemType === 'theme' 
      ? themes.find(t => t.name === itemName)
      : cardStyles.find(c => c.name === itemName);

    if (selectedItem?.premium && !purchasedItems.includes(itemName)) {
      if (!connectedWalletAddress) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your Pera Wallet to make purchases.",
          variant: "destructive",
        });
        return;
      }
      setSelectedItem({ type: itemType, name: itemName });
      setShowPurchaseModal(true);
    } else if (selectedItem?.specialEdition) {
      const requiredPoints = selectedItem.requiredPoints || 300;
      if (rewardPoints >= requiredPoints) {
        if (itemType === 'theme') {
          setTheme(itemName);
        } else {
          setCardStyle(itemName);
        }
      } else {
        toast({
          title: "Not enough reward points",
          description: `You need at least ${requiredPoints} reward points to use this Special Edition item.`,
          variant: "destructive",
        });
      }
    } else {
      if (itemType === 'theme') {
        setTheme(itemName);
      } else {
        setCardStyle(itemName);
      }
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/user/settings`, {
        theme,
        cardStyle,
        bio,
        profileNFT: selectedNFT,
        nfd: selectedNFD
      }, {
        withCredentials: true
      });

      if (response.data) {
        // Update local storage with confirmed server values
        localStorage.setItem(`theme_${user.twitter?.username}`, response.data.theme);
        localStorage.setItem(`cardStyle_${user.twitter?.username}`, response.data.cardStyle);
        
        onSettingsUpdate();
        onClose();
        toast({
          title: "Success",
          description: "Your settings have been saved.",
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings. Please try again.');
      toast({
        title: "Error",
        description: "Failed to save your settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFetchNFTs = async () => {
    if (!connectedWalletAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your Pera Wallet to fetch NFTs.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingNFTs(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/peraWalletRoutes/fetch-wallet-nfts/${connectedWalletAddress}`);
      setNfts(response.data);
      setShowNFTModal(true);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch NFTs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingNFTs(false);
    }
  };

  const handleFetchNFDs = async () => {
    if (!connectedWalletAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your Pera Wallet to fetch NFDs.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingNFDs(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/peraWalletRoutes/fetch-wallet-nfds/${connectedWalletAddress}`);
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
  };

  const handleSelectNFT = (nft: NFT) => {
    setSelectedNFT(nft);
    setShowNFTModal(false);
  };

  const handleSelectNFD = (nfd: NFD) => {
    if (!nfd || typeof nfd !== 'object') {
      setSelectedNFD(null);
      return;
    }
    
    setSelectedNFD({
      id: nfd.id?.toString() || 'unknown',
      name: nfd.name?.toString() || 'Unnamed NFD',
      assetId: nfd.assetId?.toString()
    });
    setShowNFDModal(false);
  };

  const handleCreateNFT = () => {
    window.open('https://www.wen.tools/simple-mint', '_blank');
  };

  const handlePurchaseConfirmation = async (paymentType: 'USDC' | 'ORA') => {
    if (selectedItem) {
      if (!connectedWalletAddress) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your Pera Wallet to make purchases.",
          variant: "destructive",
        });
        setShowPurchaseModal(false);
        return;
      }

      setProcessingPaymentType(paymentType); 
      try {
        let accounts: string[] = [];
        try {
          accounts = await peraWallet.reconnectSession();
        } catch (error) {
          accounts = await peraWallet.connect();
        }
  
        if (accounts.length === 0) {
          toast({
            title: "Connection Failed",
            description: "Failed to connect to Pera Wallet. Please try again.",
            variant: "destructive",
          });
          return;
        }
  
        const userAddress = accounts[0];
  
        const response = await axios.post(
          `${API_BASE_URL}/api/theme/purchase`, 
          { themeName: selectedItem.name, userAddress, paymentType },
          { withCredentials: true }
        );
        
        const { unsignedTxn, themeName: confirmedThemeName } = response.data;
  
        const binaryUnsignedTxn = new Uint8Array(Buffer.from(unsignedTxn, 'base64'));
        const decodedTxn = algosdk.decodeUnsignedTransaction(binaryUnsignedTxn);
  
        if (!decodedTxn) {
          throw new Error('Failed to decode transaction');
        }
  
        const signedTxns = await peraWallet.signTransaction([[{ txn: decodedTxn }]]);
  
        if (!signedTxns || signedTxns.length === 0) {
          throw new Error('No signed transactions received');
        }
  
        const confirmResponse = await axios.post(
          `${API_BASE_URL}/api/theme/confirm`,
          {
            signedTxn: Buffer.from(signedTxns[0]).toString('base64'),
            themeName: confirmedThemeName,
            paymentType
          },
          { withCredentials: true }
        );
  
        if (confirmResponse.data.success) {
          setPurchasedItems(prev => [...prev, selectedItem.name]);
          if (selectedItem.type === 'theme') {
            setTheme(selectedItem.name);
          } else {
            setCardStyle(selectedItem.name);
          }
          setShowConfetti(true);
          toast({
            title: "Congratulations!",
            description: "Purchase successful!",
            variant: "default",
          });
          setTimeout(() => setShowConfetti(false), 5000);

          const pointsResponse = await axios.get(`${API_BASE_URL}/api/user/reward-points`, { 
            withCredentials: true 
          });
          setRewardPoints(pointsResponse.data.rewardPoints);
        } else {
          throw new Error(confirmResponse.data.message || 'Transaction failed');
        }
      } catch (error) {
        console.error(`Error purchasing ${selectedItem.type}:`, error);
        toast({
          title: "Error",
          description: `Failed to purchase ${selectedItem.type}. Please try again.`,
          variant: "destructive",
        });
      } finally {
        setProcessingPaymentType(null);
        setShowPurchaseModal(false);
      }
    }
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
            {showConfetti && <Confetti />}
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-xl font-bold text-black">My Studio </h1>
                  <div className="flex items-center space-x-8">
                    <span className="text-xs font-medium text-gray-600">Unique Profile Views:</span>
                    <span className="text-lg font-bold text-black">{profileViews}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Card Style Selection */}
                  <div>
                    <Button
                      onClick={() => setOpenTab(openTab === 'cardStyle' ? null : 'cardStyle')}
                      className="w-full flex justify-between items-center py-2 px-4"
                      variant="outline"
                    >
                      <span>Choose Your Card Style</span>
                      {openTab === 'cardStyle' ? <ChevronUp /> : <ChevronDown />}
                    </Button>

                    <AnimatePresence>
                      {openTab === 'cardStyle' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-6 mt-4">
                            {/* Regular Card Styles */}
                            <div>
                              <h4 className="text-lg font-semibold mb-4">Standard Card Styles</h4>
                              <div className="grid grid-cols-3 gap-4">
                                {cardStyles
                                  .filter(c => !c.specialEdition)
                                  .map((c) => (
                                    <div key={c.name} className="relative">
                                      <Button
                                        variant="outline"
                                        className={`w-full py-2 px-4 h-auto text-left transition-all duration-200 overflow-hidden ${
                                          cardStyle === c.name 
                                            ? 'bg-[#ACA1D0] text-white' 
                                            : 'bg-white text-black hover:bg-gray-100'
                                        } ${c.premium && !purchasedItems.includes(c.name) ? 'opacity-50' : ''}`}
                                        onClick={() => handleItemSelection('cardStyle', c.name)}
                                      >
                                        <span className="block truncate pr-6">{c.name}</span>
                                        {c.premium && !purchasedItems.includes(c.name) && (
                                          <span className="absolute top-1 right-1 text-xs bg-green-500 text-white px-2 py-1 rounded-full font-semibold shadow-sm">
                                            Buy Now
                                          </span>
                                        )}
                                      </Button>
                                    </div>
                                  ))}
                              </div>
                            </div>

                            {/* Special Edition Card Styles */}
                            <div className="border-t pt-4">
                              <h4 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                                <span>Special Edition Card Styles</span>
                                <TooltipProvider delayDuration={0}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="h-6 w-6 p-0"
                                      >
                                        <Info className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="w-64 p-2">
                                      Special Edition card styles are exclusive designs unlocked with reward points.
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </h4>
                              <div className="grid grid-cols-3 gap-4">
                                {cardStyles
                                  .filter(c => c.specialEdition)
                                  .map((c) => (
                                    <div key={c.name} className="relative">
                                      <Button
                                        variant="outline"
                                        className={`w-full py-2 px-4 h-auto text-left transition-all duration-200 overflow-hidden ${
                                          cardStyle === c.name 
                                            ? 'bg-[#ACA1D0] text-white' 
                                            : 'bg-white text-black hover:bg-gray-100'
                                        } ${rewardPoints < (c.requiredPoints || 300) ? 'opacity-50' : ''}`}
                                        onClick={() => handleItemSelection('cardStyle', c.name)}
                                        disabled={rewardPoints < (c.requiredPoints || 300)}
                                      >
                                        <span className="block truncate pr-6">{c.name}</span>
                                        <span className="absolute top-1 right-1 text-xs bg-[#40E0D0] text-white px-2 py-1 rounded-full font-semibold shadow-sm">
                                          Special Edition
                                        </span>
                                      </Button>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Background Selection */}
                  <div>
                    <Button
                      onClick={() => setOpenTab(openTab === 'background' ? null : 'background')}
                      className="w-full flex justify-between items-center py-2 px-4"
                      variant="outline"
                    >
                      <span>Choose Your Background</span>
                      {openTab === 'background' ? <ChevronUp /> : <ChevronDown />}
                    </Button>

                    <AnimatePresence>
                      {openTab === 'background' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-6 mt-4">
                            {/* Regular Backgrounds */}
                            <div>
                              <h4 className="text-lg font-semibold mb-4">Standard Backgrounds</h4>
                              <div className="grid grid-cols-3 gap-4">
                                {themes
                                  .filter(t => !t.specialEdition)
                                  .map((t) => (
                                    <div key={t.name} className="relative">
                                      <Button
                                        variant="outline"
                                        className={`w-full py-2 px-4 h-auto text-left transition-all duration-200 overflow-hidden ${
                                          theme === t.name 
                                            ? 'bg-[#8B7AB4] text-white' 
                                            : 'bg-white text-black hover:bg-gray-100'
                                        } ${t.premium && !purchasedItems.includes(t.name) ? 'opacity-50' : ''}`}
                                        onClick={() => handleItemSelection('theme', t.name)}
                                      >
                                        <span className="block truncate pr-6">{t.name}</span>
                                        {t.premium && !purchasedItems.includes(t.name) && (
                                          <span className="absolute top-1 right-1 text-xs bg-green-500 text-white px-2 py-1 rounded-full font-semibold shadow-sm">
                                            Buy Now
                                          </span>
                                        )}
                                      </Button>
                                    </div>
                                  ))}
                              </div>
                            </div>

                            {/* Special Edition Backgrounds */}
                            <div className="border-t pt-4">
                              <h4 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                                <span>Special Edition Backgrounds</span>
                                <TooltipProvider delayDuration={0}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="h-6 w-6 p-0"
                                      >
                                        <Info className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="w-64 p-2">
                                      Special Edition backgrounds are exclusive designs unlocked with reward points.
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </h4>
                              <div className="grid grid-cols-3 gap-4">
                                {themes
                                  .filter(t => t.specialEdition)
                                  .map((t) => (
                                    <div key={t.name} className="relative">
                                      <Button
                                        variant="outline"
                                        className={`w-full py-2 px-4 h-auto text-left transition-all duration-200 overflow-hidden ${
                                          theme === t.name 
                                            ? 'bg-[#8B7AB4] text-white' 
                                            : 'bg-white text-black hover:bg-gray-100'
                                        } ${rewardPoints < (t.requiredPoints || 300) ? 'opacity-50' : ''}`}
                                        onClick={() => handleItemSelection('theme', t.name)}
                                        disabled={rewardPoints < (t.requiredPoints || 300)}
                                      >
                                        <span className="block truncate pr-6">{t.name}</span>
                                        <span className="absolute top-1 right-1 text-xs bg-[#40E0D0] text-white px-2 py-1 rounded-full font-semibold shadow-sm">
                                          Special Edition
                                        </span>
                                      </Button>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* About Me Section */}
                  <div>
                    <Button
                      onClick={() => setOpenTab(openTab === 'bio' ? null : 'bio')}
                      className="w-full flex justify-between items-center py-2 px-4"
                      variant="outline"
                    >
                      <span>About Me</span>
                      {openTab === 'bio' ? <ChevronUp /> : <ChevronDown />}
                    </Button>

                    <AnimatePresence>
                      {openTab === 'bio' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 space-y-4">
                            <div>
                              <h4 className="text-lg font-semibold mb-4">About Me</h4>
                              <Label htmlFor="bio" className="text-sm text-gray-500 mb-2 block">
                                Express yourself in 25 words or less
                              </Label>
                              <Textarea
                                id="bio"
                                value={bio}
                                onChange={(e) => {
                                  const words = e.target.value.trim().split(/\s+/);
                                  if (words.length <= 25) {
                                    setBio(e.target.value);
                                  }
                                }}
                                className="w-full bg-white text-black rounded-md px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent"
                                rows={2}
                                placeholder="Tell others about yourself..."
                              />
                              <div className="mt-1 text-sm text-gray-500 flex justify-end">
                                {bio.trim().split(/\s+/).filter(word => word.length > 0).length}/25 words
                              </div>
                            </div>

                            {/* NFT & NFDomains Section */}
                            <div>
                              <Label className="text-lg font-medium text-black mb-2 block">
                                Profile NFT & NFDomains
                              </Label>
                              <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                  <Button 
                                    onClick={handleFetchNFTs} 
                                    disabled={isLoadingNFTs} 
                                    className={`w-full bg-[#FFB951] text-black px-4 py-2 rounded-lg flex items-center justify-center shadow-md hover:bg-[#FFB951]/90 transition-all border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed`}
                                  >
                                    {isLoadingNFTs ? 'Loading...' : 'Select NFT'}
                                  </Button>
                                  <Button 
                                    onClick={handleCreateNFT} 
                                    className="w-full bg-[#40E0D0] text-black px-4 py-2 rounded-lg flex items-center justify-center shadow-md hover:bg-[#40E0D0]/90 transition-all border-2 border-black"
                                  >
                                    <ExternalLink size={16} className="mr-2" />
                                    Create NFT
                                  </Button>
                                  <Button 
                                    onClick={handleFetchNFDs} 
                                    disabled={isLoadingNFDs} 
                                    className={`w-full bg-[#FF6B6B] text-black px-4 py-2 rounded-lg flex items-center justify-center shadow-md hover:bg-[#FF6B6B]/90 transition-all border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed`}
                                  >
                                    {isLoadingNFDs ? 'Loading...' : 'Select NFD'}
                                  </Button>
                                </div>
                                <div className="flex space-x-4">
                                  <div className="w-2/3">
                                    {selectedNFT && selectedNFT.image && (
                                      <div className="flex items-center space-x-2">
                                        <svg width="40" height="40" viewBox="0 0 40 40">
                                          <defs>
                                            <clipPath id="circle-clip">
                                              <circle cx="20" cy="20" r="20" />
                                            </clipPath>
                                          </defs>
                                          <image 
                                            href={selectedNFT.image} 
                                            xlinkHref={selectedNFT.image}
                                            width="40" 
                                            height="40" 
                                            preserveAspectRatio="xMidYMid slice"
                                            clipPath="url(#circle-clip)"
                                          />
                                        </svg>
                                        <span className="text-sm text-black">
                                          {selectedNFT.name || 'Unnamed NFT'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="w-1/3">
                                    {selectedNFD && selectedNFD.name && (
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm text-black">
                                          {typeof selectedNFD.name === 'string' ? selectedNFD.name : ''}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Reward Points Section */}
                  <div>
                    <Button
                      onClick={() => setOpenTab(openTab === 'rewards' ? null : 'rewards')}
                      className="w-full flex justify-between items-center py-2 px-4"
                      variant="outline"
                    >
                      <span>Reward Points</span>
                      {openTab === 'rewards' ? <ChevronUp /> : <ChevronDown />}
                    </Button>

                    <AnimatePresence>
                      {openTab === 'rewards' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 p-6 bg-[#FFB951] rounded-lg text-black shadow-md border-2 border-black">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-2xl font-semibold">My Balance:</h3>
                              <div className="flex items-center bg-[#40E0D0] px-4 py-2 rounded-lg border-2 border-black shadow-md">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2 text-black">
                                  <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.816a3.836 3.836 0 00-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 01-.921-.421l-.879-.66a.75.75 0 00-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 001.5 0v-.81a4.124 4.124 0 001.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 00-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 00.933-1.175l-.415-.33a3.836 3.836 0 00-1.719-.755V6z" />
                                </svg>
                                <span className="text-3xl font-bold">{rewardPoints}</span>
                              </div>
                            </div>
                            
                            <div className="bg-[#FF6B6B] p-4 rounded-lg border-2 border-black shadow-md">
                              <h4 className="text-lg font-semibold mb-2">How to Earn Reward Points?</h4>
                              <ul className="space-y-2">
                                <li className="flex items-center bg-[#40E0D0] p-2 rounded-lg border-2 border-black mb-2">
                                  <CheckCircle size={16} className="mr-2 text-black" />
                                  <span>Verification: <strong>+100 points</strong></span>
                                </li>
                                <li className="flex items-center bg-[#FFB951] p-2 rounded-lg border-2 border-black mb-2">
                                  <CheckCircle size={16} className="mr-2 text-black" />
                                  <span>Every account included in verification: <strong>+25 points</strong></span>
                                </li>
                                <li className="flex items-center bg-[#40E0D0] p-2 rounded-lg border-2 border-black mb-2">
                                  <CheckCircle size={16} className="mr-2 text-black" />
                                  <span>Card Style or Background purchases: <strong>+50 points</strong></span>
                                </li>
                                <li className="flex items-center bg-[#FFB951] p-2 rounded-lg border-2 border-black mb-2">
                                  <CheckCircle size={16} className="mr-2 text-black" />
                                  <span>Unique profile views: <strong>+15 points</strong></span>
                                </li>
                                <li className="flex items-center bg-[#40E0D0] p-2 rounded-lg border-2 border-black">
                                  <CheckCircle size={16} className="mr-2 text-black" />
                                  <span>Add NFT or NFD to profile: <strong>+75 points</strong></span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4 mt-6">
                    <Button
                      onClick={onClose}
                      className="bg-white text-black hover:bg-gray-300 border-2 border-black"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveSettings} 
                      disabled={saving}
                      className="bg-[#FF6B6B] text-black hover:bg-[#FF6B6B]/90 border-2 border-black disabled:bg-[#FF6B6B]/50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm mt-4">{error}</p>
                  )}
                </div>
              </>
            )}

            {/* Modals */}
            <NFTSelectionModal
              isOpen={showNFTModal}
              onClose={() => setShowNFTModal(false)}
              nfts={nfts}
              selectedNFT={selectedNFT}
              onSelectNFT={handleSelectNFT}
              isLoading={isLoadingNFTs}
            />

            <NFDSelectionModal
              isOpen={showNFDModal}
              onClose={() => setShowNFDModal(false)}
              nfds={nfds}
              selectedNFD={selectedNFD}
              onSelectNFD={handleSelectNFD}
              isLoading={isLoadingNFDs}
            />

            {/* Purchase Modal */}
            {showPurchaseModal && selectedItem && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg max-w-md w-full">
                  <h3 className="text-xl font-bold mb-4 text-black">Purchase {selectedItem.name}</h3>
                  <p className="text-gray-700 mb-4">
                    Select your preferred payment method:
                  </p>
                  <div className="space-y-4">
                    <Button
                      onClick={() => handlePurchaseConfirmation('USDC')}
                      disabled={processingPaymentType !== null}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {processingPaymentType === 'USDC' ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Processing...
                        </span>
                      ) : (
                        'Buy with USDC (1 USDC)'
                      )}
                    </Button>

                    <Button
                      onClick={() => handlePurchaseConfirmation('ORA')}
                      disabled={processingPaymentType !== null}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      {processingPaymentType === 'ORA' ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Processing...
                        </span>
                      ) : (
                        'Buy with ORA (10 ORA)'
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setShowPurchaseModal(false)}
                      disabled={processingPaymentType !== null}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CustomizePanel;