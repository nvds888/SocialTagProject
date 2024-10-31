import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { X } from 'lucide-react'
import axios from 'axios'

interface AssetParams {
  creator: string;
  decimals: number;
  'default-frozen': boolean;
  name: string;
  'name-b64': string;
  reserve?: string;
  total: number;
  'unit-name': string;
  'unit-name-b64': string;
  url?: string;
  'url-b64'?: string;
  'metadata-hash'?: string;
}

interface NFT {
  amount: number;
  'asset-id': number;
  'opted-in-at-round': number;
  deleted: boolean;
  'is-frozen': boolean;
  params?: AssetParams;
  id?: string; // For compatibility
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
      console.log('Processing NFT:', nft);
      
      if (!nft.params?.url) {
        console.log('No URL found for NFT:', nft);
        return '/placeholder-nft.png';
      }

      let url = nft.params.url;
      console.log('Original URL:', url);

      // Handle various URL patterns
      if (url.startsWith('template-ipfs://')) {
        const reserveCID = nft.params['metadata-hash'] || nft.params.reserve;
        if (!reserveCID) {
          console.log('No reserve CID found for template-ipfs URL');
          return '/placeholder-nft.png';
        }
        
        try {
          const response = await axios.get(`https://ipfs.io/ipfs/${reserveCID}`);
          console.log('Template IPFS response:', response.data);
          if (response.data.image) {
            return response.data.image.startsWith('ipfs://')
              ? `https://ipfs.io/ipfs/${response.data.image.slice(7)}`
              : response.data.image;
          }
        } catch (error) {
          console.warn('Failed to fetch template IPFS metadata:', error);
        }
      } else if (url.startsWith('ipfs://')) {
        // Remove any fragment identifier and get base IPFS path
        const ipfsPath = url.split('#')[0].slice(7);
        url = `https://ipfs.io/ipfs/${ipfsPath}`;
        console.log('Converted IPFS URL:', url);
        
        // If URL ends with known image extension, use it directly
        if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) {
          return url;
        }
        
        // Otherwise, try to fetch metadata
        try {
          const response = await axios.get(url);
          console.log('IPFS metadata response:', response.data);
          if (response.data.image) {
            return response.data.image.startsWith('ipfs://')
              ? `https://ipfs.io/ipfs/${response.data.image.slice(7)}`
              : response.data.image;
          }
        } catch (error) {
          console.warn('Failed to fetch IPFS metadata:', error);
        }
      } else if (url.includes('{ipfscid')) {
        const cid = nft.params['metadata-hash'] || nft.params.reserve;
        if (cid) {
          url = `https://ipfs.io/ipfs/${cid}`;
          console.log('Resolved CID template URL:', url);
        }
      }

      // Try to fetch the URL directly if it's not already an image
      if (!/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) {
        try {
          const response = await axios.get(url);
          console.log('Metadata response:', response.data);
          if (response.data.image) {
            return response.data.image.startsWith('ipfs://')
              ? `https://ipfs.io/ipfs/${response.data.image.slice(7)}`
              : response.data.image;
          }
        } catch (error) {
          console.warn('Failed to fetch metadata:', error);
        }
      }

      return url;
    } catch (error) {
      console.error('Error resolving NFT image:', error);
      return '/placeholder-nft.png';
    }
  };

  const resolveNFTImage = async (nft: NFT) => {
    const id = nft['asset-id'].toString();
    setLoadingStates(prev => ({ ...prev, [id]: true }));
    
    try {
      const image = await getImageUrl(nft);
      console.log(`Resolved image for NFT ${nft.params?.name}:`, image);
      
      setResolvedNFTs(prev => {
        const existing = prev.find(n => n['asset-id'] === nft['asset-id']);
        if (existing) {
          return prev.map(n => n['asset-id'] === nft['asset-id'] ? { ...n, image } : n);
        }
        return [...prev, { ...nft, image }];
      });
    } catch (error) {
      console.error(`Failed to resolve NFT ${nft.params?.name}:`, error);
      setErrors(prev => ({ ...prev, [id]: 'Failed to load image' }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [id]: false }));
    }
  };

  useEffect(() => {
    if (isOpen && nfts.length > 0) {
      console.log('Processing NFTs:', nfts);
      setResolvedNFTs([]);
      setLoadingStates({});
      setErrors({});
      
      // Filter out non-NFTs (e.g., fungible tokens with amount > 1)
      const nftList = nfts.filter(nft => 
        nft.params?.total === 1 || // Standard NFTs
        nft.amount === 1 || // User owns exactly 1
        (nft.params?.url && !nft.params.url.includes('pyteal.readthedocs.io')) // Has URL and isn't a pool token
      );
      
      console.log('Filtered NFT list:', nftList);
      nftList.forEach(nft => {
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
                    key={nft['asset-id']}
                    className={`cursor-pointer relative rounded-lg overflow-hidden transition-all duration-200 ${
                      selectedNFT?.['asset-id'] === nft['asset-id'] ? 'ring-2 ring-black' : 'hover:shadow-lg'
                    }`}
                    onClick={() => onSelectNFT(nft)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {loadingStates[nft['asset-id']] ? (
                      <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                      </div>
                    ) : (
                      <>
                        <img
                          src={nft.image}
                          alt={nft.params?.name || 'NFT'}
                          className="w-full h-24 object-cover"
                          onError={(e) => {
                            console.error(`Image load error for NFT ${nft.params?.name}:`, e);
                            e.currentTarget.src = '/placeholder-nft.png';
                          }}
                          loading="lazy"
                        />
                        {errors[nft['asset-id']] && (
                          <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs p-1">
                            Error loading image
                          </div>
                        )}
                      </>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-end justify-start p-1">
                      <p className="text-white text-xs font-medium truncate w-full">
                        {nft.params?.name || `NFT #${nft['asset-id']}`}
                      </p>
                    </div>
                    {selectedNFT?.['asset-id'] === nft['asset-id'] && (
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