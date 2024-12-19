import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

const IPFS_ENDPOINT = "https://ipfs.algonode.dev/ipfs/";
const IMAGE_PARAMS = "?optimizer=image&width=1152&quality=70";

interface NFT {
  id: string;
  name: string;
  url?: string;
  image?: string;
  assetId?: string;
  metadata?: {
    image?: string;
    image_url?: string;
    animation_url?: string;
    properties?: {
      image?: string;
      url?: string;
    };
  } | string; // Allow for JSON string metadata
}

interface NFTSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  nfts: NFT[];
  selectedNFT: NFT | null;
  onSelectNFT: (nft: NFT) => void;
  isLoading: boolean;
}

interface ParsedMetadata {
  image?: string;
  image_url?: string;
  animation_url?: string;
  properties?: {
    image?: string;
    url?: string;
  };
  [key: string]: unknown;
}

const parseMetadata = (metadata: string | object): ParsedMetadata => {
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch (e) {
      console.warn('Failed to parse metadata JSON:', e);
      return {};
    }
  }
  return metadata as ParsedMetadata;
};

const getImageUrl = (nft: NFT): string => {
  try {
    // Helper to clean and format URLs
    const formatUrl = (url: string): string => {
      // Handle template-ipfs with CID format
      if (url.startsWith('template-ipfs://')) {
        const match = url.match(/template-ipfs:\/\/\{ipfscid:(\d+):([^}]+)\}/);
        if (match) {
          // Extract CID from the format {ipfscid:0:dag-pb:reserve:sha2-256}
          const cid = match[2].split(':')[2]; // Get 'reserve' from the format
          return `${IPFS_ENDPOINT}${cid}${IMAGE_PARAMS}`;
        }
        // Fallback for simple template-ipfs URLs
        const ipfsCID = url.split('template-ipfs://')[1];
        return `${IPFS_ENDPOINT}${ipfsCID}${IMAGE_PARAMS}`;
      }

      // Rest of the existing URL handling...
      if (url.startsWith('ipfs://')) {
        const hash = url.slice(7).split('#')[0];
        return `${IPFS_ENDPOINT}${hash}${IMAGE_PARAMS}`;
      }
      if (url.includes('/ipfs/')) {
        const hash = url.split('/ipfs/')[1].split('?')[0];
        return `${IPFS_ENDPOINT}${hash}${IMAGE_PARAMS}`;
      }
      if (url.match(/^https?:\/\//)) {
        return url;
      }
      return `${IPFS_ENDPOINT}${url}${IMAGE_PARAMS}`;
    };

    // Try all possible URL sources in order
    const possibleUrls = [
      nft.url,
      nft.image,
      typeof nft.metadata === 'object' ? nft.metadata.image : undefined,
      typeof nft.metadata === 'object' ? nft.metadata.image_url : undefined,
      typeof nft.metadata === 'object' ? nft.metadata.animation_url : undefined,
      typeof nft.metadata === 'string' ? parseMetadata(nft.metadata).image : undefined,
      typeof nft.metadata === 'string' ? parseMetadata(nft.metadata).image_url : undefined
    ];

    // Find first valid URL and format it
    for (const url of possibleUrls) {
      if (url) {
        const formattedUrl = formatUrl(url);
        console.log(`Formatted URL for NFT ${nft.id}:`, { original: url, formatted: formattedUrl });
        return formattedUrl;
      }
    }

    return '/placeholder-nft.png';
  } catch (error) {
    console.warn('Error resolving image URL:', error);
    return '/placeholder-nft.png';
  }
};

const NFTImage: React.FC<{ nft: NFT }> = ({ nft }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Enhanced debugging
  useEffect(() => {
    const metadata = nft.metadata ? parseMetadata(nft.metadata) : {};
    console.log('NFT data:', {
      id: nft.id,
      name: nft.name,
      resolvedUrl: getImageUrl(nft),
      originalUrl: nft.url,
      rawMetadata: nft.metadata,
      parsedMetadata: metadata,
      ipfsFromMetadata: metadata?.image
    });
  }, [nft]);

  return (
    <div className="relative w-full h-full">
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <img
        src={hasError ? '/placeholder-nft.png' : getImageUrl(nft)}
        alt={nft.name || 'NFT'}
        className={`object-cover w-full h-full transition-transform duration-300 
          group-hover:scale-110 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onError={() => {
          console.warn('Image load error for NFT:', nft.id);
          setHasError(true);
          setIsLoading(false);
        }}
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
              ) : nfts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 space-y-2">
                  <p className="text-gray-500">No NFTs found in your wallet</p>
                  <p className="text-sm text-gray-400">Try connecting a different wallet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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