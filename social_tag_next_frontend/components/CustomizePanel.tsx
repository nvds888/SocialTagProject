import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Info, ChevronDown, ChevronUp, ExternalLink, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { ThemePurchaseService } from '@/services/ThemePurchaseService'
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
import PeraWalletBackground from '@/components/PeraWalletBackground'
import DefaultCard from '@/components/ProfileCard'
import FrostedGlassCard from '@/components/frosted-glass-card'
import HolographicCard from '@/components/holographic-card'
import Confetti from 'react-confetti'
import NFTSelectionModal from '@/components/NFTSelectionModal'
import NFDSelectionModal from '@/components/NFDSelectionModal'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface CustomizePanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    twitter?: { username: string };
    theme?: string;
    cardStyle?: string;
    bio?: string;
    purchasedItems?: string[];
    profileImage?: string;
    profileViews?: number;
    nfd?: string;
  };
  onSettingsUpdate: () => void;
  connectedWalletAddress: string | null;
}

interface NFT {
  id: string;
  name: string;
  image: string;
  assetId: string;
}

interface NFD {
  id: string;
  name: string;
}

const themes = [
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
  { name: 'SustainableCoffee', component: SustainableCoffeeBackground, premium: false, specialEdition: true, requiredPoints: 700 },
]

const cardStyles = [
  { name: 'Default', component: DefaultCard, premium: false },
  { name: 'Frosted Glass', component: FrostedGlassCard, premium: true },
  { name: 'Holographic', component: HolographicCard, premium: true },
]

const CustomizePanel: React.FC<CustomizePanelProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  onSettingsUpdate,
  connectedWalletAddress
}) => {
  const [theme, setTheme] = useState('SocialTag')
  const [cardStyle, setCardStyle] = useState('Default')
  const [bio, setBio] = useState(user.bio || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{ type: 'theme' | 'cardStyle', name: string } | null>(null)
  const [purchasedItems, setPurchasedItems] = useState<string[]>([])
  const [openTab, setOpenTab] = useState<string | null>(null)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showNFTModal, setShowNFTModal] = useState(false)
  const [nfts, setNfts] = useState<NFT[]>([])
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null)
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false)
  const [showNFDModal, setShowNFDModal] = useState(false)
  const [nfds, setNfds] = useState<NFD[]>([])
  const [selectedNFD, setSelectedNFD] = useState<NFD | null>(null)
  const [isLoadingNFDs, setIsLoadingNFDs] = useState(false)
  const { toast } = useToast()
  const [profileViews, setProfileViews] = useState(user.profileViews || 0)
  const [rewardPoints, setRewardPoints] = useState(0)

  useEffect(() => {
    const cachedTheme = localStorage.getItem(`theme_${user.twitter?.username}`)
    const cachedCardStyle = localStorage.getItem(`cardStyle_${user.twitter?.username}`)
    const cachedProfileNFT = localStorage.getItem(`profileNFT_${user.twitter?.username}`)
    const cachedNFD = localStorage.getItem(`nfd_${user.twitter?.username}`)
    
    setTheme(cachedTheme || user.theme || 'SocialTag')
    setCardStyle(cachedCardStyle || user.cardStyle || 'Default')
    setBio(user.bio || '')
    setProfileViews(user.profileViews || 0)

    if (cachedProfileNFT) {
      setSelectedNFT(JSON.parse(cachedProfileNFT))
    } else if (user.profileNFT) {
      setSelectedNFT(user.profileNFT)
      localStorage.setItem(`profileNFT_${user.twitter?.username}`, JSON.stringify(user.profileNFT))
    }

    if (cachedNFD) {
      setSelectedNFD(JSON.parse(cachedNFD))
    } else if (user.nfd) {
      setSelectedNFD({ id: 'current', name: user.nfd })
      localStorage.setItem(`nfd_${user.twitter?.username}`, JSON.stringify({ id: 'current', name: user.nfd }))
    }

    const cachedItems = localStorage.getItem(`purchasedItems_${user.twitter?.username}`)
    if (cachedItems) {
      setPurchasedItems(JSON.parse(cachedItems))
    } else if (user.purchasedItems) {
      setPurchasedItems(user.purchasedItems)
      localStorage.setItem(`purchasedItems_${user.twitter?.username}`, JSON.stringify(user.purchasedItems))
    }

    if (user.profileImage) {
      setSelectedNFT({ id: 'current', name: 'Current Profile Image', image: user.profileImage })
    }
  }, [user])

  const updatePurchasedItemsCache = (newItems: string[]) => {
    setPurchasedItems(newItems)
    localStorage.setItem(`purchasedItems_${user.twitter?.username}`, JSON.stringify(newItems))
  }

  const handleItemSelection = (itemType: 'theme' | 'cardStyle', itemName: string) => {
    const selectedItem = itemType === 'theme' 
      ? themes.find(t => t.name === itemName)
      : cardStyles.find(c => c.name === itemName)

    if (selectedItem?.premium && !purchasedItems.includes(itemName)) {
      setSelectedItem({ type: itemType, name: itemName })
      setShowPurchaseModal(true)
    } else if (selectedItem?.specialEdition) {
      const requiredPoints = selectedItem.requiredPoints || 300 // Default to 300 if not specified
      if (rewardPoints >= requiredPoints) {
        if (itemType === 'theme') {
          setTheme(itemName)
          localStorage.setItem(`theme_${user.twitter?.username}`, itemName)
        }
      } else {
        toast({
          title: "Not enough reward points",
          description: "You need at least ${requiredPoints} reward points to use this Special Edition background.",
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

  const handlePurchaseConfirmation = async () => {
    if (selectedItem) {
      setIsPurchasing(true)
      try {
        const result = await ThemePurchaseService.purchaseTheme(selectedItem.name);

        if (result.success) {
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
          setError(result.message || `Failed to purchase ${selectedItem.type}. Please try again.`);
        }
      } catch (error) {
        console.error(`Error purchasing ${selectedItem.type}:`, error);
        setError(`An error occurred while purchasing the ${selectedItem.type}.`);
      } finally {
        setIsPurchasing(false)
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

  const handleFetchNFTs = async () => {
    if (!connectedWalletAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your Pera Wallet to fetch NFTs.",
        variant: "destructive",
      })
      return
    }

    setIsLoadingNFTs(true)
    setError(null)
    try {
      const response = await axios.get(`${API_BASE_URL}/peraWalletRoutes/fetch-wallet-nfts/${connectedWalletAddress}`)
      setNfts(response.data)
      setShowNFTModal(true)
    } catch (error) {
      console.error('Error fetching NFTs:', error)
      setError('Failed to fetch NFTs. Please try again.')
    } finally {
      setIsLoadingNFTs(false)
    }
  }

  const handleSelectNFT = (nft: NFT) => {
    setSelectedNFT(nft)
    setShowNFTModal(false)
  }

  const handleFetchNFDs = async () => {
    if (!connectedWalletAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your Pera Wallet to fetch NFDs.",
        variant: "destructive",
      })
      return
    }

    setIsLoadingNFDs(true)
    setError(null)
    try {
      const response = await axios.get(`${API_BASE_URL}/peraWalletRoutes/fetch-wallet-nfds/${connectedWalletAddress}`)
      setNfds(response.data)
      setShowNFDModal(true)
    } catch (error) {
      console.error('Error fetching NFDs:', error)
      setError('Failed to fetch NFDs. Please try again.')
    } finally {
      setIsLoadingNFDs(false)
    }
  }

  const handleSelectNFD = (nfd: NFD) => {
    setSelectedNFD(nfd)
    setShowNFDModal(false)
  }

  const handleCreateNFT = () => {
    window.open('https://www.wen.tools/simple-mint', '_blank');
  };

  const fetchRewardPoints = async () => {
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
  }

  useEffect(() => {
    if (isOpen) {
      fetchRewardPoints()
    }
  }, [isOpen])

  const handleSaveSettings = async () => {
    setSaving(true)
    setError(null)
    try {
      const response = await axios.post(`${API_BASE_URL}/api/user/settings`, { 
        theme, 
        cardStyle, 
        bio,
        profileNFT: selectedNFT,
        nfd: selectedNFD ? {
          id: selectedNFD.id,
          name: selectedNFD.name,
          assetId: selectedNFD.assetId 
        } : null
      })
      if (response.data) {
        setTheme(response.data.theme)
        setCardStyle(response.data.cardStyle)
        setBio(response.data.bio)
        if (response.data.profileNFT) {
          setSelectedNFT(response.data.profileNFT)
          localStorage.setItem(`profileNFT_${user.twitter?.username}`, JSON.stringify(response.data.profileNFT))
        } else {
          setSelectedNFT(null)
          localStorage.removeItem(`profileNFT_${user.twitter?.username}`)
        }
        if (response.data.nfd) {
            setSelectedNFD({ 
              id: response.data.nfd.id, 
              name: response.data.nfd.name,
              assetId: response.data.nfd.assetId
            })
            localStorage.setItem(`nfd_${user.twitter?.username}`, JSON.stringify({ 
              id: response.data.nfd.id, 
              name: response.data.nfd.name,
              assetId: response.data.nfd.assetId
            }))
        } else {
          setSelectedNFD(null)
          localStorage.removeItem(`nfd_${user.twitter?.username}`)
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
              <h2 className="text-xl font-bold text-black">tag /tag/ noun: A small label used to identify or provide information about someone or something.</h2>
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
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        {cardStyles.map((c) => (
                          <div key={c.name} className="relative">
                            <Button
                              variant="outline"
                              className={`w-full py-2 px-4 h-auto text-left transition-all duration-200 overflow-hidden ${
                                cardStyle === c.name 
                                  ? 'bg-black text-white' 
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
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        {themes.map((t) => (
                          <div key={t.name} className="relative">
                            <Button
                              variant="outline"
                              className={`w-full py-2 px-4 h-auto text-left transition-all duration-200 overflow-hidden ${
                                theme === t.name 
                                  ? 'bg-black text-white' 
                                  : 'bg-white text-black hover:bg-gray-100'
                              } ${
                                (t.premium && !purchasedItems.includes(t.name)) || 
                                (t.specialEdition && rewardPoints < (t.requiredPoints || 300)) 
                                  ? 'opacity-50' 
                                  : ''
                              }`}
                              onClick={() => handleItemSelection('theme', t.name)}
                              disabled={(t.specialEdition && rewardPoints < (t.requiredPoints || 300))}
                            >
                              <span className="block truncate pr-6">{t.name}</span>
                              {t.premium && !purchasedItems.includes(t.name) && (
                                <span className="absolute top-1 right-1 text-xs bg-green-500 text-white px-2 py-1 rounded-full font-semibold shadow-sm">Buy Now</span>
                              )}
                              {t.specialEdition && (
                                <span className="absolute top-1 right-1 text-xs bg-yellow-400 text-white px-2 py-1 rounded-full font-semibold shadow-sm">Special Edition</span>
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
                            {t.specialEdition && (
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
                            )}
                          </div>
                        ))}
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
                          <Label htmlFor="bio" className="text-lg font-medium text-gray-700 mb-2 block">
                            About Me (max 25 words)
                          </Label>
                          <Textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full bg-white text-black rounded-md px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent"
                            rows={2}
                            maxLength={250}
                          />
                        </div>
                        <div>
  <Label className="text-lg font-medium text-black mb-2 block">
    Profile NFT & NFDomains
  </Label>
  <div className="space-y-4">
    <div className="grid grid-cols-3 gap-4">
      <Button onClick={handleFetchNFTs} disabled={isLoadingNFTs} className="w-full">
        {isLoadingNFTs ? 'Loading...' : 'Select NFT'}
      </Button>
      <Button onClick={handleCreateNFT} className="w-full">
      <ExternalLink size={16} className="mr-2" />
        Create NFT
      </Button>
      <Button onClick={handleFetchNFDs} disabled={isLoadingNFDs} className="w-full">
        {isLoadingNFDs ? 'Loading...' : 'Select NFD'}
      </Button>
    </div>
    <div className="flex space-x-4">
      <div className="w-2/3">
        {selectedNFT && (
          <div className="flex items-center space-x-2">
            <img src={selectedNFT.image} alt={selectedNFT.name} className="w-10 h-10 rounded-full object-cover" />
            <span className="text-sm text-black">{selectedNFT.name}</span>
          </div>
        )}
      </div>
      <div className="w-1/3">
        {selectedNFD && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-black">{selectedNFD.name}</span>
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
                      <div className="mt-4 p-6 bg-yellow-400 rounded-lg text-black shadow-md">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-2xl font-semibold">My Balance:</h3>
    <div className="flex items-center">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2 text-black">
    <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 01-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004zM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 01-.921.42z" />
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.816a3.836 3.836 0 00-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 01-.921-.421l-.879-.66a.75.75 0 00-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 001.5 0v-.81a4.124 4.124 0 001.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 00-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 00.933-1.175l-.415-.33a3.836 3.836 0 00-1.719-.755V6z" clipRule="evenodd" />
  </svg>
  <span className="text-3xl font-bold">{rewardPoints}</span>
</div>
  </div>
  
  <div className="bg-yellow-200 p-4 rounded-lg">
    <h4 className="text-lg font-semibold mb-2">How to Earn Reward Points?</h4>
    <ul className="space-y-2">
      <li className="flex items-center">
        <CheckCircle size={16} className="mr-2 text-green-600" />
        <span>Verification Hash: <strong>+100 points</strong></span>
      </li>
      <li className="flex items-center">
        <CheckCircle size={16} className="mr-2 text-green-600" />
        <span>Each account in verification: <strong>+25 points</strong></span>
      </li>
      <li className="flex items-center">
        <CheckCircle size={16} className="mr-2 text-green-600" />
        <span>Card Style or Background purchases: <strong>+50 points</strong></span>
      </li>
      <li className="flex items-center">
        <CheckCircle size={16} className="mr-2 text-green-600" />
        <span>Unique profile views (we use cookies): <strong>+15 points</strong></span>
      </li>
      <li className="flex items-center">
        <CheckCircle size={16} className="mr-2 text-green-600" />
        <span>Add NFT or NFD to profile: <strong>+75 points</strong></span>
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
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>

            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

            {showPurchaseModal && selectedItem && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg max-w-md w-full">
                  <h3 className="text-xl font-bold mb-4 text-black">Confirm Purchase</h3>
                  <p className="text-gray-700 mb-4">
                    Are you sure you want to purchase the {selectedItem.name} {selectedItem.type} for 1 USDC?
                  </p>
                  <div className="flex justify-end space-x-4">
                    <Button variant="outline" onClick={() => setShowPurchaseModal(false)}>Cancel</Button>
                    <Button onClick={handlePurchaseConfirmation} disabled={isPurchasing}>
                      {isPurchasing ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        'Yes, Purchase for $1'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CustomizePanel