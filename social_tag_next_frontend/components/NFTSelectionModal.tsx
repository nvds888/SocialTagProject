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

  const getImageUrl = async (nft: NFT): Promise<string> => {
    try {
      console.log('Processing NFT:', nft);

      // Skip NFDs
      if (nft.name?.toLowerCase().includes('nfd') || nft.name?.toLowerCase().includes('.algo')) {
        console.log('Skipping NFD:', nft.name);
        return '';
      }

      // Case 1: Direct image URL already exists
      if (nft.image && !nft.image.includes('ipfs://')) {
        return nft.image;
      }

      // Case 2: Check metadata object if it exists
      if (nft.metadata) {
        const metadataImage = nft.metadata.image || nft.metadata.image_url || nft.metadata.animation_url;
        if (metadataImage) {
          if (metadataImage.startsWith('ipfs://')) {
            return `https://ipfs.io/ipfs/${metadataImage.slice(7)}`;
          }
          return metadataImage;
        }
      }

      // Case 3: Handle ARC3 NFTs
      if (nft.url?.includes('#arc3')) {
        try {
          let baseUrl = nft.url.split('#')[0];
          // Handle direct IPFS URLs
          if (baseUrl.startsWith('ipfs://')) {
            baseUrl = `https://ipfs.io/ipfs/${baseUrl.slice(7)}`;
          }
          console.log('Fetching ARC3 metadata from:', baseUrl);
          
          const response = await axios.get(baseUrl);
          console.log('ARC3 metadata response:', response.data);
          
          if (response.data.image) {
            const imageUrl = response.data.image;
            if (imageUrl.startsWith('ipfs://')) {
              const ipfsHash = imageUrl.slice(7);
              console.log('Converting IPFS image URL:', ipfsHash);
              return `https://ipfs.io/ipfs/${ipfsHash}`;
            }
            return imageUrl;
          }
        } catch (error) {
          console.warn('Failed to fetch ARC3 metadata:', error);
        }
      }

      // Case 4: Handle template-ipfs URLs
      if (nft.url?.startsWith('template-ipfs://')) {
        try {
          const cid = nft.reserve || nft['metadata-hash'];
          if (!cid) return '/placeholder-nft.png';

          const response = await axios.get(`https://ipfs.io/ipfs/${cid}`);
          console.log('Template IPFS response:', response.data);
          
          if (response.data.image) {
            const imageUrl = response.data.image;
            if (imageUrl.startsWith('ipfs://')) {
              return `https://ipfs.io/ipfs/${imageUrl.slice(7)}`;
            }
            return imageUrl;
          }
        } catch (error) {
          console.warn('Failed to fetch template IPFS metadata:', error);
        }
      }

      // Case 5: Handle direct IPFS URLs
      if (nft.url?.startsWith('ipfs://')) {
        const ipfsPath = nft.url.split('#')[0].slice(7);
        const url = `https://ipfs.io/ipfs/${ipfsPath}`;
        
        try {
          // Try to fetch as metadata first
          const response = await axios.get(url);
          console.log('IPFS response:', response.data);
          
          if (response.data.image) {
            const imageUrl = response.data.image;
            if (imageUrl.startsWith('ipfs://')) {
              return `https://ipfs.io/ipfs/${imageUrl.slice(7)}`;
            }
            return imageUrl;
          }
        } catch {
          // If metadata fetch fails, try using the URL directly
          return url;
        }
      }

      // Case 6: Handle IPFS CID template
      if (nft.url?.includes('{ipfscid')) {
        const cid = nft['metadata-hash'] || nft.reserve;
        if (cid) {
          const url = `https://ipfs.io/ipfs/${cid}`;
          try {
            // Try to fetch metadata first
            const response = await axios.get(url);
            if (response.data.image) {
              if (response.data.image.startsWith('ipfs://')) {
                return `https://ipfs.io/ipfs/${response.data.image.slice(7)}`;
              }
              return response.data.image;
            }
          } catch {
            // If metadata fetch fails, return the direct URL
            return url;
          }
        }
      }

      // Case 7: Handle direct URL with metadata
      if (nft.url && !nft.url.includes('ipfs://') && !nft.url.includes('{ipfscid')) {
        try {
          const response = await axios.get(nft.url);
          if (response.data.image) {
            if (response.data.image.startsWith('ipfs://')) {
              return `https://ipfs.io/ipfs/${response.data.image.slice(7)}`;
            }
            return response.data.image;
          }
        } catch (error) {
          console.warn('Failed to fetch NFT metadata:', error);
        }
      }

      // Case 8: Check if the URL itself is a direct image link
      if (nft.url && (
        nft.url.endsWith('.jpg') || 
        nft.url.endsWith('.jpeg') || 
        nft.url.endsWith('.png') || 
        nft.url.endsWith('.gif') || 
        nft.url.endsWith('.svg')
      )) {
        return nft.url;
      }

      return '/placeholder-nft.png';
    } catch (error) {
      console.error('Error resolving NFT image:', error);
      return '/placeholder-nft.png';
    }
  };

  const resolveNFTImage = async (nft: NFT) => {
    setLoadingStates(prev => ({ ...prev, [nft.id]: true }));
    try {
      const image = await getImageUrl(nft);
      // Only add NFT if it has a valid image and is not an NFD
      if (image && !nft.name?.toLowerCase().includes('nfd') && !nft.name?.toLowerCase().includes('.algo')) {
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
    if (isOpen && nfts.length > 0) {
      // Reset states when modal opens with new NFTs
      setResolvedNFTs([]);
      setLoadingStates({});
      
      // Filter out NFDs before processing
      const filteredNFTs = nfts.filter(nft => 
        !nft.name?.toLowerCase().includes('nfd') && 
        !nft.name?.toLowerCase().includes('.algo')
      );
      
      // Resolve all NFTs in parallel
      filteredNFTs.forEach(nft => {
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
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full h-24 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-nft.png';
                        }}
                        loading="lazy"
                      />
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