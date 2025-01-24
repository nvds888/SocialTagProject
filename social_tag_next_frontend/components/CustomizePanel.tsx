"use client";

import React, { useState, useEffect, useCallback } from 'react'
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
import { User } from '@/types/User';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'
const peraWallet = new PeraWalletConnect();

axios.defaults.withCredentials = true

interface CustomizePanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: NonNullable<User>; 
  onSettingsUpdate: () => void;
  connectedWalletAddress: string | null;
}

interface NFT {
  assetId: number;
  metadata: {
    name: string;
    image?: string;
    [key: string]: unknown;
  };
  image?: string;
  name?: string;
}



interface ComponentProps {
  user?: User;
  theme?: string;
  cardStyle?: string;
  // Add any other common props here
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

// Define a new interface that extends ComponentProps
interface ProfileCardProps extends ComponentProps {
  // Add any additional props specific to ProfileCard here
}



export interface AlgorandAssetWithDetails {
  'asset-id': number;
  amount: number;
  params: {
    name?: string;
    'unit-name'?: string;
    url?: string;
    decimals?: number;
    total?: number;
    [key: string]: unknown;
  };
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
  { name: 'NFTicket', component: NFTicketBackground, premium: false, specialEdition: true, requiredPoints: 500 },
  { name: 'SustainableCoffee', component: SustainableCoffeeBackground, premium: false, specialEdition: true, requiredPoints: 800 },
  { name: 'OrangeMeme', component: OrangeMemeBackground, premium: false, specialEdition: true, requiredPoints: 1500 }
]

const cardStyles: CardStyleItem[] = [
  { name: 'Default', component: DefaultCard as React.FC<ProfileCardProps>, premium: false },
  { name: 'Neutral', component: NeutralCard as React.FC<ProfileCardProps>, premium: false },
  { name: 'Frosted Glass', component: FrostedGlassCard as React.FC<ProfileCardProps>, premium: true },
  { name: 'Holographic', component: HolographicCard as React.FC<ProfileCardProps>, premium: true },
  { name: 'Four Oranges', component: FourOrangesCard as React.FC<ProfileCardProps>, premium: false, specialEdition: true, requiredPoints: 800 },
]

interface SaveSettingsPayload {
  theme: string;
  cardStyle: string;
  bio: string;
  profileNFT: NFT | null;
}

const CustomizePanel: React.FC<CustomizePanelProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  onSettingsUpdate,
  connectedWalletAddress
}) => {

  const [processingPaymentType, setProcessingPaymentType] = useState<'USDC' | 'SOCIALS' | null>(null);
  const [theme, setTheme] = useState('SocialTag')
  const [cardStyle, setCardStyle] = useState('Default')
  const [bio, setBio] = useState(user.bio || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{ type: 'theme' | 'cardStyle', name: string } | null>(null)
  const [purchasedItems, setPurchasedItems] = useState<string[]>([])
  const [openTab, setOpenTab] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showNFTModal, setShowNFTModal] = useState(false)
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null)
  const [isLoadingNFTs] = useState(false)
  const { toast } = useToast()
  const [profileViews, setProfileViews] = useState(user.profileViews || 0)
  const [rewardPoints, setRewardPoints] = useState(0)


  useEffect(() => {
    if (isOpen && user?.twitter?.username) {
      axios.get(`${API_BASE_URL}/api/user/${user.twitter.username}`, {
        withCredentials: true,
      })
      .then(response => {
        const data = response.data;
        setTheme(data.theme || 'SocialTag');
        setCardStyle(data.cardStyle || 'Default');
        setBio(data.bio || '');
        setProfileViews(data.profileViews || 0);
        setSelectedNFT(data.profileNFT || null);
        setPurchasedItems(data.purchasedItems || []);
        setRewardPoints(data.rewardPoints || 0);
  
        // Update local cache
        localStorage.setItem(`theme_${user?.twitter?.username}`, data.theme || 'SocialTag');
localStorage.setItem(`cardStyle_${user?.twitter?.username}`, data.cardStyle || 'Default');
localStorage.setItem(`purchasedItems_${user?.twitter?.username}`, JSON.stringify(data.purchasedItems || []));

if (data.profileNFT) {
  localStorage.setItem(`profileNFT_${user?.twitter?.username}`, JSON.stringify(data.profileNFT));
}
      })
      .catch(error => {
        console.error('Error fetching user data:', error);
        setError('Failed to fetch current settings');
      });
    }
  }, [isOpen, user]);

  const updatePurchasedItemsCache = (newItems: string[]) => {
    setPurchasedItems(newItems)
    localStorage.setItem(`purchasedItems_${user.twitter?.username}`, JSON.stringify(newItems))
  }

  const handleItemSelection = (itemType: 'theme' | 'cardStyle', itemName: string) => {
    const selectedItem = itemType === 'theme' 
      ? themes.find(t => t.name === itemName)
      : cardStyles.find(c => c.name === itemName)

    if (selectedItem?.premium && !purchasedItems.includes(itemName)) {
      // Check if wallet is connected before showing purchase modal
      if (!connectedWalletAddress) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your Pera Wallet to make purchases.",
          variant: "destructive",
        });
        return;
      }
      setSelectedItem({ type: itemType, name: itemName })
      setShowPurchaseModal(true)
    } else if (selectedItem?.specialEdition) {
      const requiredPoints = selectedItem.requiredPoints || 300
      if (rewardPoints >= requiredPoints) {
        if (itemType === 'theme') {
          setTheme(itemName)
          localStorage.setItem(`theme_${user.twitter?.username}`, itemName)
        } else {
          setCardStyle(itemName);
          localStorage.setItem(`cardStyle_${user.twitter?.username}`, itemName);
        }
      } else {
        toast({
          title: "Not enough reward points",
          description: `You need at least ${requiredPoints} reward points to use this Special Edition background.`,
          variant: "destructive",
        })
      }
    } else {
      if (itemType === 'theme') {
        setTheme(itemName)
        localStorage.setItem(`theme_${user.twitter?.username}`, itemName)
      } else {
        setCardStyle(itemName)
        localStorage.setItem(`cardStyle_${user.twitter?.username}`, itemName)
      }
    }
  }

  const handlePurchaseConfirmation = async (paymentType: 'USDC' | 'SOCIALS') => {
    if (selectedItem) {
      // Double check wallet connection before proceeding with purchase
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
        // Rest of the purchase logic remains the same...
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
  
        // Request the unsigned transaction
        const response = await axios.post(
          `${API_BASE_URL}/api/theme/purchase`, 
          { themeName: selectedItem.name, userAddress, paymentType },
          { withCredentials: true }
        );
        
        const { unsignedTxn, themeName: confirmedThemeName } = response.data;
  
        // Decode the transaction
        const binaryUnsignedTxn = new Uint8Array(Buffer.from(unsignedTxn, 'base64'));
        const decodedTxn = algosdk.decodeUnsignedTransaction(binaryUnsignedTxn);
  
        if (!decodedTxn) {
          throw new Error('Failed to decode transaction');
        }
  
        // Sign the transaction with Pera Wallet
        const signedTxns = await peraWallet.signTransaction([[{ txn: decodedTxn }]]);
  
        if (!signedTxns || signedTxns.length === 0) {
          throw new Error('No signed transactions received');
        }
  
        // Send the signed transaction for confirmation
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
          const newPurchasedItems = [...purchasedItems, selectedItem.name]
          updatePurchasedItemsCache(newPurchasedItems)
          if (selectedItem.type === 'theme') {
            setTheme(selectedItem.name)
            localStorage.setItem(`theme_${user.twitter?.username}`, selectedItem.name)
          } else {
            setCardStyle(selectedItem.name)
            localStorage.setItem(`cardStyle_${user.twitter?.username}`, selectedItem.name)
          }
          setShowConfetti(true)
          toast({
            title: "Congratulations!",
            description: "Check it out directly",
            variant: "default",
          })
          setTimeout(() => setShowConfetti(false), 5000)
          fetchRewardPoints()
        } else {
          throw new Error(confirmResponse.data.message || 'Transaction failed');
        }
      } catch (error) {
        console.error(`Error purchasing ${selectedItem.type}:`, error);
        setError(`An error occurred while purchasing the ${selectedItem.type}.`);
      } finally {
        setProcessingPaymentType(null);
        setShowPurchaseModal(false)
      }
    }
  };

  const renderPreview = (itemType: 'theme' | 'cardStyle', itemName: string) => {
    if (itemType === 'theme') {
      const theme = themes.find(t => t.name === itemName);
      return theme?.component ? <theme.component /> : null;
    } else {
      const cardStyle = cardStyles.find(c => c.name === itemName);
      return cardStyle?.component ? <cardStyle.component /> : null;
    }
  };

  const toggleTab = (tabName: string) => {
    setOpenTab(openTab === tabName ? null : tabName);
  };



  const handleSelectNFT = (nft: NFT | null) => {
    setSelectedNFT(nft);
    setShowNFTModal(false);
  };


  const handleCreateNFT = () => {
    window.open('https://www.wen.tools/simple-mint', '_blank');
  };

  const fetchRewardPoints = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user/reward-points`, { withCredentials: true })
      setRewardPoints(response.data.rewardPoints)
    } catch (error) {
      console.error('Error fetching reward points:', error)
      toast({
        title: "Error",
        description: "Failed to fetch reward points. Please try again.",
        variant: "destructive",
      })
    }
  }, [toast]); // Added 'toast' to the dependency array

  useEffect(() => {
    if (isOpen) {
      fetchRewardPoints()
    }
  }, [isOpen, fetchRewardPoints])

  const handleSaveSettings = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload: SaveSettingsPayload = {
        theme, 
        cardStyle, 
        bio,
        profileNFT: selectedNFT || null,
      };
  
      const response = await axios.post(
        `${API_BASE_URL}/api/user/settings`, 
        payload,
        { withCredentials: true }
      );
  
      if (response.data) {
        setTheme(response.data.theme)
        setCardStyle(response.data.cardStyle)
        setBio(response.data.bio)
        
        // Handle profileNFT updates
        if (response.data.profileNFT) {
          setSelectedNFT(response.data.profileNFT)
          localStorage.setItem(`profileNFT_${user.twitter?.username}`, JSON.stringify(response.data.profileNFT))
        } else {
          setSelectedNFT(null)
          localStorage.removeItem(`profileNFT_${user.twitter?.username}`)
        }
  
  
        localStorage.setItem(`theme_${user.twitter?.username}`, response.data.theme)
        localStorage.setItem(`cardStyle_${user.twitter?.username}`, response.data.cardStyle)
        
        onSettingsUpdate()
        onClose()
      } else {
        throw new Error('Settings not updated')
      }
    } catch (err) {
      console.error('Error saving settings:', err)
      setError('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

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
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold text-black">My Studio </h1>
              <div className="flex items-center space-x-8">
                <span className="text-xs font-medium text-gray-600">Unique Profile Views:</span>
                <span className="text-lg font-bold text-black">{profileViews}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
              <Button
  onClick={() => toggleTab('cardStyle')}
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
                      <span className="absolute top-1 right-1 text-xs bg-green-500 text-white px-2 py-1 rounded-full font-semibold shadow-sm">Buy Now</span>
                    )}
                  </Button>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="absolute top-1/2 right-2 transform -translate-y-1/2 p-0 h-6 w-6 bg-transparent text-black opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="bottom" 
                        className="w-64 h-40 p-0" 
                        sideOffset={5}
                      >
                        <div className="w-full h-full relative overflow-hidden rounded-md">
                          {renderPreview('cardStyle', c.name)}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ))}
          </div>
        </div>

        {/* Special Edition Card Styles Section */}
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
                  Special Edition card styles are exclusive designs unlocked with reward points. Earn points through various activities to unlock unique styles!
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
                    <span className="absolute top-1 right-1 text-xs bg-[#40E0D0] text-white px-2 py-1 rounded-full font-semibold shadow-sm">Special Edition</span>
                  </Button>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="absolute top-1/2 right-2 transform -translate-y-1/2 p-0 h-6 w-6 bg-transparent text-black opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="bottom" 
                        className="w-64 h-40 p-0" 
                        sideOffset={5}
                      >
                        <div className="w-full h-full relative overflow-hidden rounded-md">
                          {renderPreview('cardStyle', c.name)}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="absolute top-1/2 left-2 transform -translate-y-1/2 p-0 h-6 w-6 bg-transparent text-black opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="w-64 p-2" sideOffset={5}>
                        {rewardPoints >= (c.requiredPoints || 300)
                          ? "You've unlocked this Special Edition card style!" 
                          : `Unlock this Special Edition card style by earning ${(c.requiredPoints || 300) - rewardPoints} more reward points.`
                        }
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ))}
          </div>
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>
              </div>

              <div>
  <Button
    onClick={() => toggleTab('background')}
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
          {/* Regular Themes */}
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
                        <span className="absolute top-1 right-1 text-xs bg-green-500 text-white px-2 py-1 rounded-full font-semibold shadow-sm">Buy Now</span>
                      )}
                    </Button>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="absolute top-1/2 right-2 transform -translate-y-1/2 p-0 h-6 w-6 bg-transparent text-black opacity-60 hover:opacity-100 transition-opacity"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="bottom" 
                          className="w-64 h-40 p-0" 
                          sideOffset={5}
                        >
                          <div className="w-full h-full relative overflow-hidden rounded-md">
                            <div className="absolute inset-0 scale-[1.2] origin-center">
                              {renderPreview('theme', t.name)}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
            </div>
          </div>

          {/* Special Edition Section */}
          <div className="border-t pt-4">
            <h4 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <span> Special Edition Backgrounds</span>
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
                    Special Edition items are exclusive backgrounds unlocked with reward points. Earn points through various activities to unlock unique designs!
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
                      <span className="absolute top-1 right-1 text-xs bg-[#40E0D0] text-white px-2 py-1 rounded-full font-semibold shadow-sm">Special Edition</span>
                    </Button>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="absolute top-1/2 right-2 transform -translate-y-1/2 p-0 h-6 w-6 bg-transparent text-black opacity-60 hover:opacity-100 transition-opacity"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="bottom" 
                          className="w-64 h-40 p-0" 
                          sideOffset={5}
                        >
                          <div className="w-full h-full relative overflow-hidden rounded-md">
                            <div className="absolute inset-0 scale-[1.2] origin-center">
                              {renderPreview('theme', t.name)}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="absolute top-1/2 left-2 transform -translate-y-1/2 p-0 h-6 w-6 bg-transparent text-black opacity-60 hover:opacity-100 transition-opacity"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="w-64 p-2" sideOffset={5}>
                          {rewardPoints >= (t.requiredPoints || 300)
                            ? "You've unlocked this Special Edition background!" 
                            : `Unlock this Special Edition background by earning ${(t.requiredPoints || 300) - rewardPoints} more reward points.`
                          }
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
</div>

              <div>
                <Button
                  onClick={() => toggleTab('bio')}
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
                        <div>
  <Label className="text-lg font-medium text-black mb-2 block">
    Profile NFT
  </Label>
  <div className="space-y-4">
  <div className="grid grid-cols-3 gap-4">
  <Button 
  onClick={() => setShowNFTModal(true)} 
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
    <span className="text-sm text-black">{selectedNFT.name || 'Unnamed NFT'}</span>
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

              <div>
                <Button
                  onClick={() => toggleTab('rewards')}
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
        <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 01-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004zM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 01-.921.42z" />
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.816a3.836 3.836 0 00-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 01-.921-.421l-.879-.66a.75.75 0 00-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 001.5 0v-.81a4.124 4.124 0 001.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 00-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 00.933-1.175l-.415-.33a3.836 3.836 0 00-1.719-.755V6z" clipRule="evenodd" />
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
        <span>Every account included in verification: <strong>+50 points</strong></span>
      </li>
      <li className="flex items-center bg-[#40E0D0] p-2 rounded-lg border-2 border-black mb-2">
        <CheckCircle size={16} className="mr-2 text-black" />
        <span>Card Style or Background purchases: <strong>+50 points</strong></span>
      </li>
      <li className="flex items-center bg-[#FFB951] p-2 rounded-lg border-2 border-black mb-2">
        <CheckCircle size={16} className="mr-2 text-black" />
        <span>Unique profile views: <strong>+5 points</strong></span>
      </li>
      <li className="flex items-center bg-[#40E0D0] p-2 rounded-lg border-2 border-black">
        <CheckCircle size={16} className="mr-2 text-black" />
        <span>Add NFT to profile: <strong>+75 points</strong></span>
      </li>
    </ul>
  </div>
</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <Button
                  onClick={() => toggleTab('purchasedItems')}
                  className="w-full flex justify-between items-center py-2 px-4"
                  variant="outline"
                >
                  <span>Purchased Items</span>
                  {openTab === 'purchasedItems' ? <ChevronUp /> : <ChevronDown />}
                </Button>
                <AnimatePresence>
                  {openTab === 'purchasedItems' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4">
                        {purchasedItems.length > 0 ? (
                          <ul className="list-disc list-inside">
                            {purchasedItems.map((item, index) => (
                              <li key={index} className="text-gray-700">{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500">No items purchased yet.</p>
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
   className="bg-white text-black hover:bg-gray-300 border-2 border-black"
    >Cancel
    </Button>
  <Button 
    onClick={handleSaveSettings} 
    disabled={saving}
    className="bg-[#FF6B6B] text-black hover:bg-[#FF6B6B]/90 border-2 border-black disabled:bg-[#FF6B6B]/50"
  >
    {saving ? 'Saving...' : 'Save Changes'}
  </Button>
</div>

            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

            {showPurchaseModal && selectedItem && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg max-w-sm w-full">
      <h3 className="text-xl font-bold mb-4 text-black">Purchase</h3>
      <p className="text-gray-700 mb-4">
        Select payment method for {selectedItem.name} {selectedItem.type}:
      </p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Button
          onClick={() => handlePurchaseConfirmation('USDC')}
          disabled={processingPaymentType !== null}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2"
        >
          {processingPaymentType === 'USDC' ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            <div className="flex flex-col items-center">
              <span>USDC</span>
              <span className="text-xs opacity-90">1 USDC</span>
            </div>
          )}
        </Button>

        <Button
          onClick={() => handlePurchaseConfirmation('SOCIALS')}
          disabled={processingPaymentType !== null}
          className="bg-[#40E0D0] hover:bg-[#3dd2c3] text-white text-sm py-2"
        >
          {processingPaymentType === 'SOCIALS' ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            <div className="flex flex-col items-center">
              <span>SOCIALS</span>
              <span className="text-xs opacity-90">100M SOCIALS</span>
            </div>
          )}
        </Button>
      </div>

      <Button
        variant="outline"
        onClick={() => setShowPurchaseModal(false)}
        disabled={processingPaymentType !== null}
        className="w-full text-sm"
      >
        Cancel
      </Button>
    </div>
  </div>
)}

<NFTSelectionModal
  isOpen={showNFTModal}
  onClose={() => setShowNFTModal(false)}
  walletAddress={connectedWalletAddress}  // Add this line
  network="mainnet"                       // Add this line
  selectedNFT={selectedNFT}
  onSelectNFT={handleSelectNFT}
/>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CustomizePanel