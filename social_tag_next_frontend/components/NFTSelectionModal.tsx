import React, { useState } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface AssetParams {
  url?: string;
  name?: string;
  [key: string]: unknown;
}

interface Asset {
  'asset-id': number;
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

async function fetchNFTMetadata(assetId: number, network: string): Promise<string | undefined> {
  const url = `${getIndexerURL(network)}/v2/assets/${assetId}`;
  try {
    const response = await axios.get(url);
    return response.data.asset.params.url;
  } catch (error) {
    console.error(`Error fetching metadata for asset ${assetId}:`, error);
    return undefined;
  }
}

async function fetchIPFSData(ipfsUrl: string): Promise<NFTMetadata> {
  try {
    const response = await axios.get(ipfsUrl);
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

  async function loadNFTs() {
    if (!walletAddress) {
      setError('No wallet address provided');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const assets = await axios.get<{ assets: Asset[] }>(
        `${getIndexerURL(network)}/v2/accounts/${walletAddress}/assets`
      );

      const loadedNfts = await Promise.all(
        assets.data.assets.map(async (asset): Promise<NFT | null> => {
          try {
            const metadataUrl = await fetchNFTMetadata(asset['asset-id'], network);
            if (!metadataUrl) return null;

            const ipfsUrl = metadataUrl.replace('ipfs://', 'https://ipfs.algonode.dev/ipfs/');
            const metadata = await fetchIPFSData(ipfsUrl);

            return {
              assetId: asset['asset-id'],
              metadata,
              image: metadata.image?.replace('ipfs://', 'https://ipfs.algonode.dev/ipfs/'),
              name: metadata.name
            };
          } catch (err) {
            console.error(`Error processing asset ${asset['asset-id']}:`, err);
            return null;
          }
        })
      );

      // Filter out null values and type assert the result
      setNfts(loadedNfts.filter((nft): nft is NFT => nft !== null));
    } catch (err) {
      console.error('Error loading NFTs:', err);
      setError('Failed to load NFTs. Please try again.');
    } finally {
      setIsLoading(false);
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
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : nfts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {!walletAddress 
                  ? 'Please connect your wallet first'
                  : 'No NFTs found in your wallet or click Load NFTs to fetch them.'}
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