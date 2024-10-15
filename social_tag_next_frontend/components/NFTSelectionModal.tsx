import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { X } from 'lucide-react'
import axios from 'axios'

interface NFT {
  id: string;
  name: string;
  url: string;
  'metadata-hash'?: string;
  reserve?: string;
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

  const getImageUrl = async (nft: NFT): Promise<string> => {
    if (nft.url.startsWith('template-ipfs://')) {
      try {
        const response = await axios.get(`https://ipfs.io/ipfs/${nft.reserve}`);
        return response.data.image || '/placeholder-nft.png';
      } catch (error) {
        console.error('Error fetching NFT metadata:', error);
        return '/placeholder-nft.png';
      }
    } else if (nft.url.startsWith('ipfs://')) {
      return `https://ipfs.io/ipfs/${nft.url.slice(7)}`;
    } else if (nft.url.includes('{ipfscid:0:dag-pb:reserve:sha2-256}')) {
      const cid = nft['metadata-hash'] || nft.reserve;
      return `https://ipfs.io/ipfs/${cid}`;
    } else {
      return nft.url || '/placeholder-nft.png';
    }
  };

  useEffect(() => {
    const resolveNFTImages = async () => {
      const resolved = await Promise.all(nfts.map(async (nft) => {
        const image = await getImageUrl(nft);
        return { ...nft, image };
      }));
      setResolvedNFTs(resolved);
    };

    if (isOpen && nfts.length > 0) {
      resolveNFTImages();
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
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-full h-24 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-nft.png'
                      }}
                    />
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
  )
}

export default NFTSelectionModal