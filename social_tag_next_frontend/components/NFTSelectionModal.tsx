import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { X } from 'lucide-react'
import axios from 'axios'

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
  nfts: NFT[];
  selectedNFT: NFT | null;
  onSelectNFT: (nft: NFT) => void;
  isLoading: boolean;
}

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getImageUrl = async (nft: NFT): Promise<string> => {
    try {
      console.log(`Resolving image for NFT:`, nft);

      // Case 1: Direct image URL already exists
      if (nft.image && !nft.image.includes('ipfs://')) {
        console.log('Using existing image URL:', nft.image);
        return nft.image;
      }

      // Case 2: Handle ARC3 metadata
      if (nft.url?.includes('#arc3')) {
        try {
          const baseUrl = nft.url.split('#')[0];
          const ipfsUrl = baseUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
          console.log('Fetching ARC3 metadata from:', ipfsUrl);
          const response = await axios.get(ipfsUrl);
          if (response.data.image) {
            const imageUrl = response.data.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
            console.log('Found ARC3 image:', imageUrl);
            return imageUrl;
          }
        } catch (error) {
          console.warn('Failed to fetch ARC3 metadata:', error);
        }
      }

      // Case 3: Handle template-ipfs URLs with reserve
      if (nft.url?.startsWith('template-ipfs://')) {
        try {
          const reserveCID = nft['metadata-hash'] || nft.reserve;
          if (reserveCID) {
            const response = await axios.get(`https://ipfs.io/ipfs/${reserveCID}`);
            if (response.data.image) {
              return response.data.image.startsWith('ipfs://')
                ? `https://ipfs.io/ipfs/${response.data.image.slice(7)}`
                : response.data.image;
            }
          }
        } catch (error) {
          console.warn('Failed to fetch template IPFS metadata:', error);
        }
      }

      // Case 4: Handle direct IPFS URLs with or without 'i' suffix
      if (nft.url?.startsWith('ipfs://')) {
        const ipfsPath = nft.url.slice(7);
        const baseUrl = ipfsPath.split('#')[0]; // Remove any fragment identifier
        console.log('Processing IPFS URL:', ipfsPath);
        
        // Try multiple IPFS gateways
        const gateways = [
          'https://ipfs.io/ipfs/',
          'https://gateway.pinata.cloud/ipfs/',
          'https://cloudflare-ipfs.com/ipfs/'
        ];

        for (const gateway of gateways) {
          try {
            const url = `${gateway}${baseUrl}`;
            console.log('Trying gateway:', url);
            const response = await axios.get(url);
            
            // If response is JSON, try to get image from metadata
            if (typeof response.data === 'object' && response.data.image) {
              const imageUrl = response.data.image.replace('ipfs://', `${gateway}`);
              console.log('Found image in metadata:', imageUrl);
              return imageUrl;
            }
            
            // If response is not JSON, assume it's the image itself
            return url;
          } catch (error) {
            console.warn(`Failed to fetch from gateway ${gateway}:`, error);
            continue;
          }
        }
      }

      // Case 5: Handle IPFS CID template
      if (nft.url?.includes('{ipfscid')) {
        const cid = nft['metadata-hash'] || nft.reserve;
        if (cid) {
          return `https://ipfs.io/ipfs/${cid}`;
        }
      }

      // Case 6: Handle direct URL with metadata
      if (nft.url && !nft.url.includes('ipfs://') && !nft.url.includes('{ipfscid')) {
        try {
          const response = await axios.get(nft.url);
          if (response.data.image) {
            return response.data.image.startsWith('ipfs://')
              ? `https://ipfs.io/ipfs/${response.data.image.slice(7)}`
              : response.data.image;
          }
        } catch (error) {
          console.warn('Failed to fetch NFT metadata:', error);
        }
      }

      console.log('No image found, using placeholder for:', nft);
      return '/placeholder-nft.png';
    } catch (error) {
      console.error('Error resolving NFT image:', error);
      setErrors(prev => ({
        ...prev,
        [nft.id]: error instanceof Error ? error.message : 'Unknown error'
      }));
      return '/placeholder-nft.png';
    }
  };

  const resolveNFTImage = async (nft: NFT) => {
    setLoadingStates(prev => ({ ...prev, [nft.id]: true }));
    try {
      const image = await getImageUrl(nft);
      console.log(`Resolved image for NFT ${nft.name}:`, image);
      setResolvedNFTs(prev => {
        const existing = prev.find(n => n.id === nft.id);
        if (existing) {
          return prev.map(n => n.id === nft.id ? { ...n, image } : n);
        }
        return [...prev, { ...nft, image }];
      });
    } catch (error) {
      console.error(`Failed to resolve NFT ${nft.name}:`, error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [nft.id]: false }));
    }
  };

  useEffect(() => {
    if (isOpen && nfts.length > 0) {
      console.log('Processing NFTs:', nfts);
      setResolvedNFTs([]);
      setLoadingStates({});
      setErrors({});
      
      nfts.forEach(nft => {
        resolveNFTImage(nft);
      });
    }
  }, [isOpen, nfts]);

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
            className="bg-white p-4 rounded-lg max-w-xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-black">Select NFT as Profile Image</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
              </div>
            ) : resolvedNFTs.length === 0 ? (
              <p className="text-center text-gray-500">No NFTs found in your wallet.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-3">
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
                            console.error(`Image load error for NFT ${nft.name}:`, e);
                            e.currentTarget.src = '/placeholder-nft.png';
                          }}
                          loading="lazy"
                        />
                        {errors[nft.id] && (
                          <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs p-1">
                            Error loading image
                          </div>
                        )}
                      </>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-end justify-start p-1">
                      <p className="text-white text-xs font-medium truncate w-full">
                        {nft.name}
                      </p>
                    </div>
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