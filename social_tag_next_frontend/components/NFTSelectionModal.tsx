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
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addDebugLog = (message: string) => {
    console.log(message);
    setDebugLog(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const getImageUrl = async (nft: NFT): Promise<string> => {
    try {
      addDebugLog(`Processing NFT: ${nft.name} (ID: ${nft.id})`);
      addDebugLog(`NFT Data: ${JSON.stringify({
        url: nft.url,
        metadata: nft.metadata,
        image: nft.image,
        'metadata-hash': nft['metadata-hash'],
        reserve: nft.reserve
      }, null, 2)}`);

      // Remove NFD filtering to show all NFTs
      // Instead of filtering out, just log them
      if (nft.name?.toLowerCase().includes('nfd') || nft.name?.toLowerCase().includes('.algo')) {
        addDebugLog(`Note: This is an NFD/Algo domain: ${nft.name}`);
      }

      // Case 1: Direct image URL
      if (nft.image && !nft.image.includes('ipfs://')) {
        addDebugLog(`Found direct image URL: ${nft.image}`);
        return nft.image;
      }

      // Case 2: Metadata object
      if (nft.metadata) {
        const metadataImage = nft.metadata.image || nft.metadata.image_url || nft.metadata.animation_url;
        if (metadataImage) {
          if (metadataImage.startsWith('ipfs://')) {
            const ipfsUrl = `https://ipfs.io/ipfs/${metadataImage.slice(7)}`;
            addDebugLog(`Converting IPFS metadata image to: ${ipfsUrl}`);
            return ipfsUrl;
          }
          addDebugLog(`Using metadata image URL: ${metadataImage}`);
          return metadataImage;
        }
      }

      // Case 3: ARC3 NFTs
      if (nft.url?.includes('#arc3')) {
        try {
          let baseUrl = nft.url.split('#')[0];
          if (baseUrl.startsWith('ipfs://')) {
            baseUrl = `https://ipfs.io/ipfs/${baseUrl.slice(7)}`;
          }
          addDebugLog(`Fetching ARC3 metadata from: ${baseUrl}`);
          
          const response = await axios.get(baseUrl);
          addDebugLog(`ARC3 metadata response: ${JSON.stringify(response.data)}`);
          
          if (response.data.image) {
            const imageUrl = response.data.image;
            if (imageUrl.startsWith('ipfs://')) {
              const ipfsUrl = `https://ipfs.io/ipfs/${imageUrl.slice(7)}`;
              addDebugLog(`Converting ARC3 IPFS image to: ${ipfsUrl}`);
              return ipfsUrl;
            }
            return imageUrl;
          }
        } catch (error) {
          addDebugLog(`Failed to fetch ARC3 metadata: ${error}`);
        }
      }

      // Case 4: Direct IPFS URLs
      if (nft.url?.startsWith('ipfs://')) {
        const ipfsPath = nft.url.split('#')[0].slice(7);
        const url = `https://ipfs.io/ipfs/${ipfsPath}`;
        addDebugLog(`Trying direct IPFS URL: ${url}`);
        
        try {
          const response = await axios.get(url);
          if (response.data.image) {
            const imageUrl = response.data.image;
            if (imageUrl.startsWith('ipfs://')) {
              const finalUrl = `https://ipfs.io/ipfs/${imageUrl.slice(7)}`;
              addDebugLog(`Resolved IPFS image URL: ${finalUrl}`);
              return finalUrl;
            }
            return imageUrl;
          }
        } catch (error) {
          addDebugLog(`Failed to fetch IPFS metadata, trying direct URL: ${url}`);
          return url;
        }
      }

      // Case 5: Try alternate IPFS gateways if primary fails
      const alternateGateways = [
        'https://ipfs.io/ipfs/',
        'https://cloudflare-ipfs.com/ipfs/',
        'https://gateway.pinata.cloud/ipfs/'
      ];

      for (const gateway of alternateGateways) {
        if (nft.url?.includes('ipfs://')) {
          const ipfsHash = nft.url.replace('ipfs://', '');
          const url = `${gateway}${ipfsHash}`;
          try {
            addDebugLog(`Trying alternate gateway: ${url}`);
            await axios.head(url);
            return url;
          } catch (error) {
            addDebugLog(`Gateway ${gateway} failed`);
          }
        }
      }

      // Fallback to placeholder but still show the NFT
      addDebugLog(`Using placeholder for NFT: ${nft.name}`);
      return '/placeholder-nft.png';
    } catch (error) {
      addDebugLog(`Error resolving NFT image: ${error}`);
      return '/placeholder-nft.png';
    }
  };

  const resolveNFTImage = async (nft: NFT) => {
    setLoadingStates(prev => ({ ...prev, [nft.id]: true }));
    try {
      const image = await getImageUrl(nft);
      // Always add NFT to resolved list, even if using placeholder
      setResolvedNFTs(prev => {
        const existing = prev.find(n => n.id === nft.id);
        if (existing) {
          return prev.map(n => n.id === nft.id ? { ...n, image } : n);
        }
        return [...prev, { ...nft, image }];
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [nft.id]: false }));
    }
  };

  useEffect(() => {
    if (isOpen && nfts.length > 0) {
      setResolvedNFTs([]);
      setLoadingStates({});
      setDebugLog([]); // Reset debug log
      
      addDebugLog(`Processing ${nfts.length} NFTs`);
      
      // Process all NFTs without filtering
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

            {/* Debug Panel */}
            <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
              <p>Total NFTs: {nfts.length}</p>
              <p>Resolved NFTs: {resolvedNFTs.length}</p>
              <p>Loading: {Object.values(loadingStates).filter(Boolean).length}</p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
              </div>
            ) : resolvedNFTs.length === 0 ? (
              <p className="text-center text-gray-500">Processing NFTs...</p>
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
                          addDebugLog(`Image load failed for: ${nft.name}`);
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

            {/* Debug Log Panel */}
            <div className="mt-4 p-2 bg-gray-100 rounded max-h-40 overflow-y-auto text-xs">
              <h3 className="font-bold mb-1">Debug Log:</h3>
              {debugLog.map((log, index) => (
                <div key={index} className="text-xs text-gray-600">{log}</div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NFTSelectionModal;