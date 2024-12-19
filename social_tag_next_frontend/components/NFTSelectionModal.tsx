import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

interface NFT {
  id: string;
  name: string;
  url?: string;
  image?: string;
  assetId?: string;
  metadata?: NFTMetadata | string;
}

interface NFTMetadata {
  image?: string;
  image_url?: string;
  animation_url?: string;
  properties?: {
    image?: string;
    url?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface NFTSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  nfts: NFT[];
  selectedNFT: NFT | null;
  onSelectNFT: (nft: NFT) => void;
  isLoading: boolean;
}

const IPFS_GATEWAY = "https://ipfs.algonode.dev/ipfs/";
const IMAGE_PARAMS = "?optimizer=image&width=1152&quality=70";

const getImageUrl = async (url: string | undefined): Promise<string | null> => {
  if (!url) return null;

  try {
    // Handle IPFS protocol
    if (url.startsWith('ipfs://')) {
      const cid = url.split('ipfs://')[1].split('#')[0];
      return `${IPFS_GATEWAY}${cid}${IMAGE_PARAMS}`;
    }

    // Handle existing IPFS gateway URLs
    if (url.includes('/ipfs/')) {
      const cid = url.split('/ipfs/')[1].split('?')[0].split('#')[0];
      return `${IPFS_GATEWAY}${cid}${IMAGE_PARAMS}`;
    }

    // Handle bare CIDs
    if (url.match(/^(bafy|Qm|baik)[a-zA-Z0-9]{44,}/)) {
      const cid = url.split('#')[0];
      return `${IPFS_GATEWAY}${cid}${IMAGE_PARAMS}`;
    }

    // Return other URLs as-is
    return url;
  } catch (error) {
    console.warn('Error processing URL:', url, error);
    return null;
  }
};

const getNFTImageUrl = async (nft: NFT): Promise<string> => {
  try {
    // Try direct URL first
    if (nft.url) {
      const directUrl = await getImageUrl(nft.url);
      if (directUrl) return directUrl;
    }

    // Try metadata
    if (nft.metadata) {
      const metadata = typeof nft.metadata === 'string' 
        ? JSON.parse(nft.metadata) 
        : nft.metadata;

      // Check various metadata fields for image URL
      const metadataImage = metadata.image 
        || metadata.image_url 
        || metadata.animation_url 
        || metadata.properties?.image 
        || metadata.properties?.url;

      if (metadataImage) {
        const metadataUrl = await getImageUrl(metadataImage);
        if (metadataUrl) return metadataUrl;
      }
    }

    throw new Error('No valid image URL found');
  } catch (error) {
    console.warn('Error getting NFT image:', nft.id, error);
    return '/placeholder-nft.png';
  }
};

const NFTImage: React.FC<{ nft: NFT }> = ({ nft }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvedUrl, setResolvedUrl] = useState<string>('/placeholder-nft.png');

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setHasError(false);

    getNFTImageUrl(nft)
      .then(url => {
        if (mounted) {
          console.log('Resolved URL for NFT', nft.id, ':', url);
          setResolvedUrl(url);
          setIsLoading(false);
        }
      })
      .catch(error => {
        console.warn('Error resolving image:', error);
        if (mounted) {
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => { mounted = false; };
  }, [nft]);

  const handleImageError = () => {
    console.warn('Image load error for NFT:', nft.id, resolvedUrl);
    setHasError(true);
    setIsLoading(false);
  };

  return (
    <div className="relative w-full h-full bg-gray-100">
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <img
        src={hasError ? '/placeholder-nft.png' : resolvedUrl}
        alt={nft.name || 'NFT'}
        className={`w-full h-full object-cover transition-all duration-300 
          group-hover:scale-110 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onError={handleImageError}
        onLoad={() => setIsLoading(false)}
        loading="lazy"
      />
    </div>
  );
};

const NFTSelectionModal: React.FC<NFTSelectionModalProps> = ({
  isOpen,
  onClose,
  nfts,
  selectedNFT,
  onSelectNFT,
  isLoading
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl"
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

            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-40 space-y-3">
                  <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Loading your NFTs...</p>
                </div>
              ) : nfts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 space-y-2">
                  <p className="text-gray-500">No NFTs found in your wallet</p>
                  <p className="text-sm text-gray-400">Try connecting a different wallet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {nfts.map((nft) => (
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
                      <NFTImage nft={nft} />
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