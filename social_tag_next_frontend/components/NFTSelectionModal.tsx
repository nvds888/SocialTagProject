"use client";

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

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

interface Asset {
  'asset-id': number;
  amount: number;
  params: {
    name?: string;
    'unit-name'?: string;
    url?: string;
    metadata?: string;
    total?: number;
    decimals?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://nftstorage.link/ipfs/'
];

const indexerAxios = axios.create({
  withCredentials: false,
  timeout: 15000
});

const getIndexerURL = (network: string): string =>
  network === 'mainnet' ? 'https://mainnet-idx.algonode.cloud' : 'https://testnet-idx.algonode.cloud';

async function processIPFSUrl(url: string): Promise<string> {
  if (url.startsWith('ipfs://')) {
    const cid = url.replace('ipfs://', '');
    // Try all IPFS gateways sequentially
    for (const gateway of IPFS_GATEWAYS) {
      try {
        const testUrl = `${gateway}${cid}`;
        await axios.head(testUrl, { timeout: 3000 });
        return testUrl;
      } catch (error) {
        continue;
      }
    }
    return `${IPFS_GATEWAYS[0]}${cid}`;
  }
  return url;
}

async function fetchMetadata(url: string): Promise<NFTMetadata> {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    return response.data;
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return { name: 'Unnamed NFT' };
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

  const loadNFTs = useCallback(async () => {
    if (!walletAddress) {
      setError('No wallet address provided');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setNfts([]);

      console.log("Fetching assets...");
      const response = await indexerAxios.get(
        `${getIndexerURL(network)}/v2/accounts/${walletAddress}/assets`
      );
      
      const assets: Asset[] = response.data.assets;
      console.log("All assets:", assets);

      // Filter for NFTs (ARC3, ARC19, ARC69)
      const nftAssets = assets.filter((asset: Asset) => {
        // Check for NFT characteristics
        const isNonFungible = asset.params.total === 1 || asset.params.decimals === 0;
        const hasMetadata = asset.params.url || asset.params.metadata;
        return isNonFungible && hasMetadata;
      });

      console.log("Filtered NFT assets:", nftAssets);
      setProgress(`Found ${nftAssets.length} potential NFTs`);

      const processedNfts: NFT[] = [];

      for (const asset of nftAssets) {
        try {
          let imageUrl: string | undefined;
          let metadata: NFTMetadata = { 
            name: asset.params?.name || asset.params?.['unit-name'] || `NFT #${asset['asset-id']}` 
          };

          // Handle ARC3 (off-chain metadata)
          if (asset.params.url) {
            try {
              const processedUrl = await processIPFSUrl(asset.params.url);
              if (processedUrl.endsWith('.json')) {
                metadata = await fetchMetadata(processedUrl);
                if (metadata.image) {
                  imageUrl = await processIPFSUrl(metadata.image);
                }
              } else {
                imageUrl = processedUrl;
              }
            } catch (error) {
              console.error('Error processing ARC3 metadata:', error);
            }
          }

          // Handle ARC19/ARC69 (on-chain metadata)
          if (asset.params.metadata) {
            try {
              const onChainMetadata = JSON.parse(asset.params.metadata);
              metadata = { ...metadata, ...onChainMetadata };
              if (onChainMetadata.image) {
                imageUrl = await processIPFSUrl(onChainMetadata.image);
              }
            } catch (error) {
              console.error('Error parsing on-chain metadata:', error);
            }
          }

          // Final validation
          if (metadata.name || imageUrl) {
            processedNfts.push({
              assetId: asset['asset-id'],
              metadata,
              image: imageUrl,
              name: metadata.name
            });
          }
        } catch (error) {
          console.error('Error processing asset:', asset['asset-id'], error);
        }
      }

      console.log("Processed NFTs:", processedNfts);
      setNfts(processedNfts);

      if (processedNfts.length === 0) {
        setError('No valid NFTs found in wallet');
      }
    } catch (err) {
      console.error('Error loading NFTs:', err);
      setError('Failed to load NFTs. Please try again.');
    } finally {
      setIsLoading(false);
      setProgress('');
    }
  }, [walletAddress, network]);

  useEffect(() => {
    if (isOpen && walletAddress) {
      loadNFTs();
    }
  }, [isOpen, walletAddress, loadNFTs]);

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
            className="w-full bg-[#FFB951] text-black hover:bg-[#FFB951]/90 border-2 border-black mb-4"
          >
            {isLoading ? 'Loading...' : 'Load NFTs'}
          </Button>

          {error && <div className="text-red-500 mb-4">{error}</div>}
          {progress && <div className="text-blue-500 mb-4">{progress}</div>}

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : nfts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {!walletAddress
                  ? 'Please connect your wallet first'
                  : 'No NFTs found in wallet'}
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
                    selectedNFT?.assetId === nft.assetId ? 'border-[#FFB951]' : 'border-gray-200'
                  }`}
                  onClick={() => onSelectNFT(nft)}
                >
                  <div className="aspect-square relative">
                    {nft.image ? (
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.onerror = null;
                          target.src = 'https://placehold.co/200x200?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-white">
                    <p className="text-sm font-medium text-gray-900 truncate">{nft.name}</p>
                    <p className="text-xs text-gray-500 truncate">ID: {nft.assetId}</p>
                  </div>
                  {selectedNFT?.assetId === nft.assetId && (
                    <div className="absolute top-2 right-2 bg-[#FFB951] text-white p-1 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          <div className="flex justify-end space-x-4 mt-6">
            <Button onClick={onClose} className="bg-white text-black hover:bg-gray-100 border-2 border-black">
              Cancel
            </Button>
            <Button
              onClick={onClose}
              className="bg-[#FFB951] text-black hover:bg-[#FFB951]/90 border-2 border-black"
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