import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import axios from 'axios';


interface NFT {
  id: string;
  name: string;
  url?: string;
  'metadata-hash'?: string;
  reserve?: string;
  image?: string;
  assetId?: string;
  metadata?: {
    image?: string;
    image_url?: string;
    animation_url?: string;
  };
}

interface NFTSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  onSelectNFT: (nft: NFT) => void;
  selectedNFT: NFT | null;
}


const NFTSelectionModal: React.FC<NFTSelectionModalProps> = ({
  isOpen,
  onClose,
  walletAddress,
  onSelectNFT,
  selectedNFT
}) => {
  const [resolvedNFTs, setResolvedNFTs] = useState<(NFT & { image: string })[]>([]);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);


  const isNFD = (nft: NFT): boolean => {
    return !!(nft.name?.toLowerCase().includes('nfd') || nft.name?.toLowerCase().includes('.algo'));
  };


const tryIPFSGateways = (url: string): string => {
  if (!url) return '/placeholder-nft.png';
  if (url.startsWith('ipfs://')) {
    const cid = url.replace('ipfs://', '').split('#')[0];
    return `https://ipfs.io/ipfs/${cid}`;
  }
  return url;
};

const getImageUrl = async (nft: NFT): Promise<string> => {
  try {
    if (isNFD(nft)) return '';

    // Handle direct image URL
    if (nft.image) {
      return nft.image.startsWith('ipfs://') ? await tryIPFSGateways(nft.image) : nft.image;
    }

    // Handle metadata URLs
    if (nft.metadata?.image || nft.metadata?.image_url || nft.metadata?.animation_url) {
      const metadataUrl = nft.metadata.image || nft.metadata.image_url || nft.metadata.animation_url;
      if (metadataUrl) {
        return metadataUrl.startsWith('ipfs://') ? await tryIPFSGateways(metadataUrl) : metadataUrl;
      }
    }

    // Handle ARC-3
    if (nft.url?.includes('#arc3')) {
      try {
        let baseUrl = nft.url.split('#')[0];
        if (baseUrl.startsWith('ipfs://')) {
          baseUrl = await tryIPFSGateways(baseUrl);
        }
        const response = await axios.get(baseUrl);
        if (response.data.image) {
          return response.data.image.startsWith('ipfs://') ? 
            await tryIPFSGateways(response.data.image) : 
            response.data.image;
        }
      } catch (error) {
        console.error('ARC-3 fetch error:', error);
      }
    }

    // Handle ARC-69
    if (nft.url && !nft.url.includes('#arc3')) {
      if (nft.url.startsWith('ipfs://')) {
        return await tryIPFSGateways(nft.url);
      }
      if (nft.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return nft.url;
      }
      try {
        const response = await axios.get(nft.url);
        if (response.data.image) {
          return response.data.image.startsWith('ipfs://') ?
            await tryIPFSGateways(response.data.image) :
            response.data.image;
        }
      } catch (error) {
        console.error('ARC-69 fetch error:', error);
      }
    }

    return '/placeholder-nft.png';
  } catch (error) {
    console.error('Image processing error:', error);
    return '/placeholder-nft.png';
  }
};

  const resolveNFTImage = async (nft: NFT) => {
    setLoadingStates(prev => ({ ...prev, [nft.id]: true }));
    try {
      const image = await getImageUrl(nft);
      if (image && !isNFD(nft)) {
        setResolvedNFTs(prev => {
          const existing = prev.find(n => n.id === nft.id);
          if (existing) {
            return prev.map(n => n.id === nft.id ? { ...n, image } : n);
          }
          return [...prev, { ...nft, image }];
        });
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, [nft.id]: false }));
    }
  };

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!isOpen || !walletAddress) return;
      
      setIsLoading(true);
      setResolvedNFTs([]);
      setLoadingStates({});
      
      try {
        const response = await axios.get(`/api/peraWalletRoutes/fetch-wallet-nfts/${walletAddress}`);
        const filteredNFTs = response.data.filter((nft: NFT) => !isNFD(nft));
        
        const loadingPromises = filteredNFTs.map((nft: NFT) => {
          return new Promise<void>((resolve) => {
            resolveNFTImage(nft).finally(() => resolve());
          });
        });

        await Promise.allSettled(loadingPromises);
      } catch (error) {
        console.error('Error fetching NFTs:', error);
      } finally {
        setIsLoading(false);
        setLoadingStates({});
      }
    };

    fetchNFTs();
  }, [isOpen, walletAddress]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-lg m-4 bg-white rounded-xl shadow-2xl"
          >
            <div className="flex items-center justify-between p-3 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Select NFT Profile Picture
              </h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 max-h-[50vh] overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-40 space-y-3">
                  <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Loading your NFTs...</p>
                </div>
              ) : resolvedNFTs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 space-y-2">
                  <p className="text-gray-500">No NFTs found in your wallet</p>
                  <p className="text-sm text-gray-400">Try connecting a different wallet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {resolvedNFTs.map((nft) => (
                    <motion.div
                      key={nft.id}
                      className={`
                        group relative aspect-square rounded-lg overflow-hidden cursor-pointer
                        ring-2 transition-all duration-200
                        ${selectedNFT?.id === nft.id ? 'ring-blue-500' : 'ring-transparent hover:ring-gray-300'}
                      `}
                      onClick={() => onSelectNFT(nft)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loadingStates[nft.id] ? (
                        <div className="flex items-center justify-center w-full h-full bg-gray-100">
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : (
                        <>
                          <img
                            src={nft.image}
                            alt={nft.name}
                            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-nft.png';
                            }}
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="absolute bottom-0 left-0 right-0 p-2">
                              <p className="text-xs text-white font-medium truncate">
                                {nft.name}
                              </p>
                            </div>
                          </div>
                          {selectedNFT?.id === nft.id && (
                            <div className="absolute top-2 right-2">
                              <div className="bg-blue-500 rounded-full p-1">
                                <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NFTSelectionModal;