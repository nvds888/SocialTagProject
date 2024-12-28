import React, { useState } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface AssetParams {
  url?: string;
  name?: string;
  'unit-name'?: string;
  total?: number;
  decimals?: number;
  [key: string]: unknown;
}

interface Asset {
  'asset-id': number;
  amount: number;
  params: AssetParams;
  [key: string]: unknown;
}

interface NFTMetadata {
  name: string;
  image?: string;
  [key: string]: unknown;
}

interface NFT {
  assetId: number;
  metadata: NFTMetadata;
  image?: string;
  name?: string;
}

interface NFTSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string | null;
  network: 'mainnet' | 'testnet';
  onSelectNFT: (nft: NFT | null) => void;
  selectedNFT: NFT | null;
}

// Create an axios instance specifically for indexer calls
const indexerAxios = axios.create({
  withCredentials: false
});

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to check if an asset is likely an NFT
function isLikelyNFT(asset: Asset): boolean {
  try {
    const params = asset.params;
    
    // Skip if essential params are missing
    if (!params) return false;

    // Skip obvious ASAs that aren't NFTs
    const unitName = params['unit-name']?.toLowerCase() || '';
    const name = params.name?.toLowerCase() || '';
    const skipTokens = ['usdc', 'algo', 'planet', 'smile', 'fish'];
    if (skipTokens.some(token => unitName.includes(token) || name.includes(token))) return false;
    
    // For NFTs we want either:
    // 1. Decimals of 0 AND (total of 1 OR amount of 1)
    // 2. OR has a URL (might be an NFT metadata URL)
    // 3. OR has a name that looks like an NFT name

    // Check for common NFT patterns in name
    const nftPatterns = ['#', 'nft', 'token', 'card', 'collectible'];
    const looksLikeNft = nftPatterns.some(pattern => name.includes(pattern) || unitName.includes(pattern));

    // Main NFT criteria
    const hasZeroDecimals = typeof params.decimals !== 'number' || params.decimals === 0;
    const hasCorrectSupply = !params.total || params.total === 1;
    const hasOneToken = asset.amount === 1;
    const hasUrl = !!params.url;

    return (
      // Traditional NFT criteria
      (hasZeroDecimals && (hasCorrectSupply || hasOneToken)) ||
      // Has metadata URL
      hasUrl ||
      // Looks like an NFT by name
      looksLikeNft
    );
  } catch (error) {
    console.error('Error checking NFT:', error);
    return false;
  }
}

async function fetchNFTMetadata(assetId: number, network: string): Promise<string | undefined> {
  try {
    const response = await indexerAxios.get(
      `${getIndexerURL(network)}/v2/assets/${assetId}`,
      { timeout: 5000 } // Add timeout
    );
    return response.data.asset.params.url;
  } catch (error) {
    console.error(`Error fetching metadata for asset ${assetId}:`, error);
    return undefined;
  }
}

async function fetchIPFSData(ipfsUrl: string): Promise<NFTMetadata> {
  try {
    if (!ipfsUrl) {
      return { name: 'Unknown', image: undefined };
    }

    // Handle different IPFS gateway formats
    let url = ipfsUrl;
    if (url.startsWith('ipfs://')) {
      url = url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }

    const response = await indexerAxios.get(url, { timeout: 5000 });
    return response.data;
  } catch (error) {
    console.error('Error fetching IPFS data:', error);
    return { name: 'Unknown', image: undefined };
  }
}

function getIndexerURL(network: string): string {
  if (network === 'mainnet') {
    return 'https://mainnet-idx.algonode.cloud';
  } else {
    return 'https://testnet-idx.algonode.cloud';
  }
}

const NFTSelectionModal: React.FC<NFTSelectionModalProps> = ({
  isOpen,
  onClose,
  walletAddress,
  network,
  onSelectNFT,
  selectedNFT
}) => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  async function loadNFTs() {
    if (!walletAddress) {
      setError('No wallet address provided');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setNfts([]);

      const assets = await indexerAxios.get<{ assets: Asset[] }>(
        `${getIndexerURL(network)}/v2/accounts/${walletAddress}/assets`
      );

      // Log total assets found
      console.log('Total assets found:', assets.data.assets.length);

      // Filter for likely NFTs first
      const nftAssets = assets.data.assets.filter(asset => {
        const isNft = isLikelyNFT(asset);
        console.log('Checking asset:', {
          id: asset['asset-id'],
          name: asset.params.name,
          isNft,
          params: asset.params
        });
        return isNft;
      });
      
      console.log('NFT assets after filtering:', nftAssets.length);
      setProgress(`Found ${nftAssets.length} potential NFTs`);

      // Process NFTs in smaller batches to avoid rate limiting
      const batchSize = 5;
      const processedNfts: NFT[] = [];

      for (let i = 0; i < nftAssets.length; i += batchSize) {
        const batch = nftAssets.slice(i, i + batchSize);
        setProgress(`Processing NFTs ${i + 1}-${Math.min(i + batchSize, nftAssets.length)} of ${nftAssets.length}`);

        const batchPromises = batch.map(async (asset): Promise<NFT | null> => {
          try {
            const metadataUrl = await fetchNFTMetadata(asset['asset-id'], network);
            console.log('MetadataURL for asset', asset['asset-id'], ':', metadataUrl);

            if (!metadataUrl) {
              // If no metadata URL, try to create NFT from asset params
              return {
                assetId: asset['asset-id'],
                metadata: {
                  name: asset.params.name || 'Unnamed NFT',
                  image: undefined
                },
                name: asset.params.name,
                image: undefined
              };
            }

            const metadata = await fetchIPFSData(metadataUrl);
            let imageUrl = metadata.image;
            
            // Handle IPFS image URLs
            if (imageUrl && imageUrl.startsWith('ipfs://')) {
              imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }

            return {
              assetId: asset['asset-id'],
              metadata,
              image: imageUrl,
              name: metadata.name || asset.params.name
            };
          } catch (err) {
            console.error(`Error processing asset ${asset['asset-id']}:`, err);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        const validBatchResults = batchResults.filter((nft): nft is NFT => nft !== null);
        processedNfts.push(...validBatchResults);
        setNfts([...processedNfts]); // Update UI with each batch

        // Add delay between batches to avoid rate limiting
        if (i + batchSize < nftAssets.length) {
          await delay(1000);
        }
      }

      if (processedNfts.length === 0) {
        setError('No NFTs found in wallet');
      }
    } catch (err) {
      console.error('Error loading NFTs:', err);
      setError('Failed to load NFTs. Please try again.');
    } finally {
      setIsLoading(false);
      setProgress('');
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="max-w-4xl w-full bg-white p-6 rounded-lg border-2 border-black">
        <DialogHeader>
          <div className="text-2xl font-bold text-black mb-4">
            <DialogTitle>Select NFT</DialogTitle>
          </div>
        </DialogHeader>
        <DialogContent>
          <Button
            onClick={loadNFTs}
            disabled={isLoading || !walletAddress}
            className="bg-[#40E0D0] text-black hover:bg-[#40E0D0]/90 border-2 border-black mb-4"
          >
            {isLoading ? 'Loading...' : 'Load NFTs'}
          </Button>

          {error && (
            <div className="text-red-500 mb-4">
              {error}
            </div>
          )}

          {progress && (
            <div className="text-blue-500 mb-4">
              {progress}
            </div>
          )}
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : nfts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {!walletAddress 
                  ? 'Please connect your wallet first'
                  : 'No NFTs found in wallet or click Load NFTs to fetch them.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4 max-h-[60vh] overflow-y-auto">
              {nfts.map((nft) => (
                <motion.div
                  key={nft.assetId}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 ${
                    selectedNFT?.assetId === nft.assetId ? 'border-[#40E0D0]' : 'border-gray-200'
                  }`}
                  onClick={() => onSelectNFT(nft)}
                >
                  <div className="aspect-square relative">
                    {nft.image ? (
                      <img
                        src={nft.image}
                        alt={nft.metadata.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://placehold.co/200x200?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-white">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {nft.metadata.name || 'Unnamed NFT'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      ID: {nft.assetId}
                    </p>
                  </div>
                  {selectedNFT?.assetId === nft.assetId && (
                    <div className="absolute top-2 right-2 bg-[#40E0D0] text-white p-1 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          <div className="flex justify-end space-x-4 mt-6">
            <Button
              onClick={onClose}
              className="bg-white text-black hover:bg-gray-100 border-2 border-black"
            >
              Cancel
            </Button>
            <Button
              onClick={onClose}
              className="bg-[#40E0D0] text-black hover:bg-[#40E0D0]/90 border-2 border-black"
              disabled={!selectedNFT}
            >
              Confirm Selection
            </Button>
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
};

export default NFTSelectionModal;