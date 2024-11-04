import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { X } from 'lucide-react'
import axios from 'axios'

// Types
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

// Constants
const IPFS_GATEWAYS = [
  'https://ipfs.algonode.xyz/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.pinata.cloud/ipfs/'
];

const VALID_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const BATCH_SIZE = 5;
const BATCH_DELAY = 500; // 500ms between batches

// Cache implementation
class ImageCache {
  private static instance: ImageCache;
  private cache: Map<string, { url: string; timestamp: number }>;
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  private constructor() {
    this.cache = new Map();
  }

  static getInstance(): ImageCache {
    if (!ImageCache.instance) {
      ImageCache.instance = new ImageCache();
    }
    return ImageCache.instance;
  }

  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.url;
  }

  set(key: string, url: string): void {
    this.cache.set(key, { url, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Helper functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isValidImageUrl = (url: string): boolean => 
  VALID_IMAGE_EXTENSIONS.some(ext => url.toLowerCase().endsWith(ext)) ||
  url.startsWith('data:image/');

const tryFetchWithGateways = async (ipfsHash: string): Promise<string> => {
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const url = `${gateway}${ipfsHash}`;
      await axios.head(url);
      return url;
    } catch (error) {
      continue;
    }
  }
  throw new Error('All IPFS gateways failed');
};

// Define a type for the expected metadata structure
interface Metadata {
  // Add properties based on the expected metadata structure
  image?: string;
  // ... other properties
}

const fetchMetadataWithRetry = async (url: string, retries = MAX_RETRIES): Promise<Metadata> => {
  try {
    const response = await axios.get(url);
    return response.data; // Ensure this matches the Metadata type
  } catch (error) {
    if (retries > 0) {
      await delay(RETRY_DELAY);
      return fetchMetadataWithRetry(url, retries - 1);
    }
    throw error;
  }
};

const getImageUrl = async (nft: NFT): Promise<string> => {
  const cache = ImageCache.getInstance();
  const cacheKey = `${nft.id}-${nft.assetId}`;
  
  try {
    // Check cache first
    const cachedUrl = cache.get(cacheKey);
    if (cachedUrl) {
      return cachedUrl;
    }

    console.log('Processing NFT:', nft);

    // Skip NFDs and .algo domains
    if (nft.name?.toLowerCase().includes('nfd') || 
        nft.name?.toLowerCase().includes('.algo')) {
      console.log('Skipping domain NFT:', nft.name);
      return '';
    }

    let imageUrl: string | null = null;

    // Case 1: Direct image URL
    if (nft.image && !nft.image.includes('ipfs://')) {
      if (isValidImageUrl(nft.image)) {
        imageUrl = nft.image;
      }
    }

    // Case 2: Check metadata object
    if (!imageUrl && nft.metadata) {
      const metadataImage = nft.metadata.image || 
                           nft.metadata.image_url || 
                           nft.metadata.animation_url;
      
      if (metadataImage) {
        if (metadataImage.startsWith('ipfs://')) {
          imageUrl = await tryFetchWithGateways(metadataImage.slice(7));
        } else if (isValidImageUrl(metadataImage)) {
          imageUrl = metadataImage;
        }
      }
    }

    // Case 3: Check ARC69 metadata
    if (!imageUrl && nft['arc69:metadata']) {
      const arc69Image = nft['arc69:metadata'].image || 
                        nft['arc69:metadata'].animation_url;
      
      if (arc69Image) {
        if (arc69Image.startsWith('ipfs://')) {
          imageUrl = await tryFetchWithGateways(arc69Image.slice(7));
        } else if (isValidImageUrl(arc69Image)) {
          imageUrl = arc69Image;
        }
      }
    }

    // Case 4: Handle ARC3 NFTs
    if (!imageUrl && nft.url?.includes('#arc3')) {
      try {
        let baseUrl = nft.url.split('#')[0];
        if (baseUrl.startsWith('ipfs://')) {
          baseUrl = await tryFetchWithGateways(baseUrl.slice(7));
        }
        
        const metadata = await fetchMetadataWithRetry(baseUrl);
        if (metadata.image) {
          if (metadata.image.startsWith('ipfs://')) {
            imageUrl = await tryFetchWithGateways(metadata.image.slice(7));
          } else {
            imageUrl = metadata.image;
          }
        }
      } catch (error) {
        console.warn('Failed to fetch ARC3 metadata:', error);
      }
    }

    // Case 5: Handle template-ipfs URLs
    if (!imageUrl && nft.url?.startsWith('template-ipfs://')) {
      try {
        const cid = nft.reserve || nft['metadata-hash'];
        if (cid) {
          const metadata = await fetchMetadataWithRetry(`${IPFS_GATEWAYS[0]}${cid}`);
          if (metadata.image) {
            if (metadata.image.startsWith('ipfs://')) {
              imageUrl = await tryFetchWithGateways(metadata.image.slice(7));
            } else {
              imageUrl = metadata.image;
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch template IPFS metadata:', error);
      }
    }

    // Case 6: Handle direct IPFS URLs
    if (!imageUrl && nft.url?.startsWith('ipfs://')) {
      try {
        const ipfsPath = nft.url.split('#')[0].slice(7);
        const url = await tryFetchWithGateways(ipfsPath);
        
        try {
          // Try to fetch as metadata first
          const metadata = await fetchMetadataWithRetry(url);
          if (metadata.image) {
            if (metadata.image.startsWith('ipfs://')) {
              imageUrl = await tryFetchWithGateways(metadata.image.slice(7));
            } else {
              imageUrl = metadata.image;
            }
          }
        } catch {
          // If metadata fetch fails, try using the URL directly
          if (isValidImageUrl(url)) {
            imageUrl = url;
          }
        }
      } catch (error) {
        console.warn('Failed to fetch IPFS content:', error);
      }
    }

    // Case 7: Handle IPFS CID template
    if (!imageUrl && nft.url?.includes('{ipfscid}')) {
      try {
        const cid = nft['metadata-hash'] || nft.reserve;
        if (cid) {
          const url = await tryFetchWithGateways(cid);
          try {
            const metadata = await fetchMetadataWithRetry(url);
            if (metadata.image) {
              if (metadata.image.startsWith('ipfs://')) {
                imageUrl = await tryFetchWithGateways(metadata.image.slice(7));
              } else {
                imageUrl = metadata.image;
              }
            }
          } catch {
            if (isValidImageUrl(url)) {
              imageUrl = url;
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch IPFS CID template:', error);
      }
    }

    // Case 8: Handle direct URL with metadata
    if (!imageUrl && nft.url && !nft.url.includes('ipfs://')) {
      try {
        if (isValidImageUrl(nft.url)) {
          imageUrl = nft.url;
        } else {
          const metadata = await fetchMetadataWithRetry(nft.url);
          if (metadata.image) {
            if (metadata.image.startsWith('ipfs://')) {
              imageUrl = await tryFetchWithGateways(metadata.image.slice(7));
            } else {
              imageUrl = metadata.image;
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch URL metadata:', error);
      }
    }

    // Case 9: Handle base64 encoded images
    if (!imageUrl && nft.image?.startsWith('data:image/')) {
      imageUrl = nft.image;
    }

    // Final fallback
    if (!imageUrl) {
      imageUrl = '/placeholder-nft.png';
    }

    // Validate final URL and cache it
    if (imageUrl && imageUrl !== '/placeholder-nft.png') {
      try {
        await axios.head(imageUrl);
        cache.set(cacheKey, imageUrl);
      } catch {
        imageUrl = '/placeholder-nft.png';
      }
    }

    return imageUrl;
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
  const [processingQueue, setProcessingQueue] = useState<boolean>(false);

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
          return [...prev, { ...nft, image }].sort((a, b) => a.name.localeCompare(b.name));
        });
      }
    } catch (error) {
      console.error('Error resolving NFT image:', error);
      setErrorStates(prev => ({ ...prev, [nft.id]: true }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [nft.id]: false }));
    }
  }, []);

  const processBatch = useCallback(async (batch: NFT[]) => {
    await Promise.all(batch.map(nft => resolveNFTImage(nft)));
    await delay(BATCH_DELAY);
  }, [resolveNFTImage]);

  useEffect(() => {
    if (isOpen && nfts.length > 0 && !processingQueue) {
      setProcessingQueue(true);
      
      const filteredNFTs = nfts.filter(nft => 
        !nft.name?.toLowerCase().includes('nfd') && 
        !nft.name?.toLowerCase().includes('.algo')
      );
      
      const batches = Array.from(
        { length: Math.ceil(filteredNFTs.length / BATCH_SIZE) },
        (_, i) => filteredNFTs.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)
      );

      (async () => {
        for (const batch of batches) {
          await processBatch(batch);
        }
        setProcessingQueue(false);
      })();
    }
  }, [isOpen, nfts, processBatch, processingQueue]);

  // Cleanup on modal close
  useEffect(() => {
    if (!isOpen) {
      setResolvedNFTs([]);
      setLoadingStates({});
      setErrorStates({});
      setProcessingQueue(false);
      ImageCache.getInstance().clear();
    }
  }, [isOpen]);

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
                    className={`
                      cursor-pointer relative rounded-lg overflow-hidden transition-all duration-200
                      ${selectedNFT?.id === nft.id ? 'ring-2 ring-black' : 'hover:shadow-lg'}
                      ${errorStates[nft.id] ? 'opacity-60' : ''}
                    `}
                    onClick={() => !errorStates[nft.id] && onSelectNFT(nft)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {loadingStates[nft.id] ? (
                      <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                      </div>
                    ) : errorStates[nft.id] ? (
                      <div className="w-full h-24 bg-gray-100 flex flex-col items-center justify-center p-2">
                        <p className="text-red-500 text-xs text-center mb-1">Failed to load</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs py-1 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            resolveNFTImage(nft);
                          }}
                        >
                          Retry
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="relative w-full h-24">
                          <img
                            src={nft.image}
                            alt={nft.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/SocialTag.jpg';
                              setErrorStates(prev => ({ ...prev, [nft.id]: true }));
                            }}
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-end justify-start p-1">
                            <p className="text-white text-xs font-medium truncate w-full">
                              {nft.name}
                            </p>
                          </div>
                        </div>
                        {selectedNFT?.id === nft.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5"
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-3 w-3 text-white" 
                              viewBox="0 0 20 20" 
                              fill="currentColor"
                            >
                              <path 
                                fillRule="evenodd" 
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                                clipRule="evenodd" 
                              />
                            </svg>
                          </motion.div>
                        )}
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
            
            {/* Loading status */}
            {(processingQueue || Object.values(loadingStates).some(Boolean)) && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">
                  Loading NFTs... {resolvedNFTs.length} loaded
                </p>
              </div>
            )}

            {/* Error summary */}
            {Object.values(errorStates).some(Boolean) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed bottom-4 right-4 max-w-xs bg-white rounded-lg shadow-lg border border-red-200 p-4"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      Some NFTs failed to load
                    </h3>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>Click retry on the failed items to try loading them again.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tips section */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                <h3 className="font-medium mb-1">Tips:</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Some NFTs might take longer to load due to IPFS gateway response times</li>
                  <li>If an NFT fails to load, you can click the retry button</li>
                  <li>Domain NFTs (.algo, NFD) are automatically filtered out</li>
                  <li>Images are cached for better performance</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NFTSelectionModal;