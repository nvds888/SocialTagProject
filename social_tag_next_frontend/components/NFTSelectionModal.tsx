import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { getNFTData } from '@/lib/nft-utils';
import { UniversalARCNFTMetadata } from '@gradian/arcviewer';

interface NFT {
  id: string;
  name?: string; 
  image?: string;
  url?: string;
  metadata?: UniversalARCNFTMetadata;
}

interface NFTSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  nfts: Array<{ id: string }>;
  selectedNFT: NFT | null;
  onSelectNFT: (nft: NFT) => void;
  isLoading: boolean;
}

interface NFTImageProps {
  nft: NFT;
  onSelect: (nft: NFT) => void;
  isSelected: boolean;
}

const NFTImage: React.FC<NFTImageProps> = ({ nft, onSelect, isSelected }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [nftData, setNFTData] = useState<NFT | null>(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setHasError(false);

    const fetchNFTData = async () => {
      try {
        const data = await getNFTData(parseInt(nft.id));
        if (mounted && data) {
          setNFTData(data);
          setIsLoading(false);
        }
      } catch (error) {
        console.warn('Error loading NFT:', error);
        if (mounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    fetchNFTData();
    return () => { mounted = false; };
  }, [nft.id]);

  const handleImageError = () => {
    console.warn('Image load error for NFT:', nft.id);
    setHasError(true);
    setIsLoading(false);
  };

  return (
    <motion.div
      className={`
        group relative aspect-square rounded-lg overflow-hidden cursor-pointer
        ring-2 transition-all duration-200
        ${isSelected ? 'ring-blue-500' : 'ring-transparent hover:ring-gray-300'}
      `}
      onClick={() => {
        if (nftData) {
          onSelect(nftData);
        }
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative w-full h-full bg-gray-100">
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {nftData && (
          <img
            src={hasError ? '/placeholder-nft.png' : nftData.image}
            alt={nftData.name || 'NFT'}
            className={`w-full h-full object-cover transition-all duration-300 
              group-hover:scale-110 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onError={handleImageError}
            onLoad={() => setIsLoading(false)}
            loading="lazy"
          />
        )}
        {nftData && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute bottom-0 left-0 right-0 p-2">
              <p className="text-xs text-white font-medium truncate">
                {nftData.name || `NFT #${nft.id}`}
              </p>
            </div>
          </div>
        )}
      </div>
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="bg-blue-500 rounded-full p-1">
            <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </motion.div>
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
                  {nfts.map((nftId) => (
                    <NFTImage 
                      key={nftId.id}
                      nft={{ id: nftId.id }}
                      onSelect={onSelectNFT}
                      isSelected={selectedNFT?.id === nftId.id}
                    />
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