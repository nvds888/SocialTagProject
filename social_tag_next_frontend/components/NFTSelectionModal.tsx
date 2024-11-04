import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { X } from 'lucide-react'
import axios from 'axios'

// Types remain the same
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
  'arc69:metadata'?: {
    image?: string;
    animation_url?: string;
  };
}

interface NFTSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  nfts: NFT[];
  selectedNFT: NFT | null;
  onSelectNFT: (nft: NFT) => void;
  isLoading: boolean;
}

// Simplified constants
const IPFS_GATEWAY = 'https://ipfs.algonode.xyz/ipfs/';
const VALID_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];

// Simplified helper functions
const isValidImageUrl = (url: string): boolean => 
  VALID_IMAGE_EXTENSIONS.some(ext => url.toLowerCase().endsWith(ext)) ||
  url.startsWith('data:image/');

const convertIpfsUrl = (ipfsUrl: string): string => {
  if (ipfsUrl.startsWith('ipfs://')) {
    return IPFS_GATEWAY + ipfsUrl.slice(7);
  }
  return ipfsUrl;
};

// Main image resolution function
const getImageUrl = async (nft: NFT): Promise<string> => {
  try {
    console.log('Processing NFT:', nft);

    // Skip NFDs and .algo domains
    if (nft.name?.toLowerCase().includes('nfd') || 
        nft.name?.toLowerCase().includes('.algo')) {
      return '';
    }

    // Primary Route 1: Direct image URL
    if (nft.image) {
      if (nft.image.startsWith('ipfs://')) {
        return convertIpfsUrl(nft.image);
      }
      return nft.image;
    }

    // Primary Route 2: Check metadata object
    if (nft.metadata?.image) {
      const metadataImage = nft.metadata.image;
      if (metadataImage.startsWith('ipfs://')) {
        return convertIpfsUrl(metadataImage);
      }
      return metadataImage;
    }

    // Primary Route 3: ARC69 metadata
    if (nft['arc69:metadata']?.image) {
      const arc69Image = nft['arc69:metadata'].image;
      if (arc69Image.startsWith('ipfs://')) {
        return convertIpfsUrl(arc69Image);
      }
      return arc69Image;
    }

    // Fallback Route 1: Try URL if it's a direct image link
    if (nft.url && isValidImageUrl(nft.url)) {
      return nft.url;
    }

    // Fallback Route 2: Try to fetch metadata from URL
    if (nft.url && !nft.url.includes('{ipfscid}')) {
      try {
        const baseUrl = nft.url.startsWith('ipfs://')
          ? convertIpfsUrl(nft.url)
          : nft.url;

        const response = await axios.get(baseUrl);
        if (response.data.image) {
          return response.data.image.startsWith('ipfs://')
            ? convertIpfsUrl(response.data.image)
            : response.data.image;
        }
      } catch (error) {
        console.warn('Failed to fetch metadata:', error);
      }
    }

    // Final fallback
    return '/placeholder-nft.png';
  } catch (error) {
    console.error('Error resolving NFT image:', error);
    return '/placeholder-nft.png';
  }
};

const NFTSelectionModal: React.FC<NFTSelectionModalProps> = ({
  isOpen,
  onClose,
  nfts,
  selectedNFT,
  onSelectNFT,
  isLoading
}) => {
  const [resolvedNFTs, setResolvedNFTs] = useState<(NFT & { image: string })[]>([]);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errorStates, setErrorStates] = useState<Record<string, boolean>>({});

  const resolveNFTImage = useCallback(async (nft: NFT) => {
    setLoadingStates(prev => ({ ...prev, [nft.id]: true }));
    setErrorStates(prev => ({ ...prev, [nft.id]: false }));
    
    try {
      const image = await getImageUrl(nft);
      if (image && !nft.name?.toLowerCase().includes('nfd') && !nft.name?.toLowerCase().includes('.algo')) {
        setResolvedNFTs(prev => {
          const existing = prev.find(n => n.id === nft.id);
          if (existing) {
            return prev.map(n => n.id === nft.id ? { ...n, image } : n);
          }
          return [...prev, { ...nft, image }];
        });
      }
    } catch (error) {
      console.error('Error resolving NFT image:', error);
      setErrorStates(prev => ({ ...prev, [nft.id]: true }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [nft.id]: false }));
    }
  }, []);

  useEffect(() => {
    if (isOpen && nfts.length > 0) {
      setResolvedNFTs([]);
      setLoadingStates({});
      setErrorStates({});
      
      const filteredNFTs = nfts.filter(nft => 
        !nft.name?.toLowerCase().includes('nfd') && 
        !nft.name?.toLowerCase().includes('.algo')
      );
      
      filteredNFTs.forEach(nft => {
        resolveNFTImage(nft);
      });
    }
  }, [isOpen, nfts, resolveNFTImage]);

  // Rest of the component (UI) remains the same as in the previous version
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
            className="bg-white p-4 rounded-lg max-w-xl w-full max-h-[80vh] overflow-y-auto relative"
          >
            <div className="sticky top-0 bg-white z-10 pb-3 mb-3 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-black">Select NFT as Profile Image</h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {isLoading && (
                <p className="text-sm text-gray-500 mt-2">Loading NFTs from your wallet...</p>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
              </div>
            ) : resolvedNFTs.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <p className="mb-2">No NFTs found in your wallet.</p>
                <p className="text-sm">Make sure you have NFTs in your connected wallet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {resolvedNFTs.map((nft) => (
                  <motion.div
                    key={nft.id}
                    className={`cursor-pointer relative rounded-lg overflow-hidden transition-all duration-200 ${
                      selectedNFT?.id === nft.id ? 'ring-2 ring-black' : 'hover:shadow-lg'
                    }`}
                    onClick={() => onSelectNFT(nft)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {loadingStates[nft.id] ? (
                      <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                      </div>
                    ) : (
                      <>
                        <img
                          src={nft.image}
                          alt={nft.name}
                          className="w-full h-24 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/SocialTag.jpg';
                            setErrorStates(prev => ({ ...prev, [nft.id]: true }));
                          }}
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-end justify-start p-1">
                          <p className="text-white text-xs font-medium truncate w-full">
                            {nft.name}
                          </p>
                        </div>
                      </>
                    )}
                    {selectedNFT?.id === nft.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </motion.div>
                    )}
                    {errorStates[nft.id] && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute bottom-1 right-1 p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          resolveNFTImage(nft);
                        }}
                      >
                        Retry
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NFTSelectionModal;