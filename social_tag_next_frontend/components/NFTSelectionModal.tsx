"use client";

import React, { useState, useEffect, useCallback } from 'react';
import axios, { CancelTokenSource } from 'axios';
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
  timeout: 15000
});

const getIndexerURL = (network: string): string =>
  network === 'mainnet' ? 'https://mainnet-idx.algonode.cloud' : 'https://testnet-idx.algonode.cloud';

async function processIPFSUrl(url: string): Promise<string> {
  if (url.startsWith('ipfs://')) {
    const cid = url.replace('ipfs://', '');
    for (const gateway of IPFS_GATEWAYS) {
      try {
        const testUrl = `${gateway}${cid}`;
        await axios.head(testUrl, { timeout: 3000 });
        return testUrl;
      } catch (error) {
        continue;
      }
    }
  }
  return url;
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
  const [cancelToken, setCancelToken] = useState<CancelTokenSource | null>(null);

  const processAsset = useCallback(async (asset: Asset, source: CancelTokenSource): Promise<NFT | null> => {
    try {
      let imageUrl: string | undefined;
      const baseMetadata: NFTMetadata = {
        name: asset.params?.name || asset.params?.['unit-name'] || `NFT #${asset['asset-id']}`
      };

      // Handle ARC3 metadata
      if (asset.params?.url) {
        try {
          const processedUrl = await processIPFSUrl(asset.params.url);
          const response = await axios.get<NFTMetadata>(processedUrl, {
            cancelToken: source.token,
            timeout: 5000
          });
          baseMetadata.name = response.data.name || baseMetadata.name;
          if (response.data.image) {
            imageUrl = await processIPFSUrl(response.data.image);
          }
        } catch (error) {
          if (!axios.isCancel(error)) {
            console.error('Error processing ARC3 metadata:', error);
          }
        }
      }

      // Handle ARC19/ARC69 metadata
      if (asset.params?.metadata) {
        try {
          const onChainMetadata = JSON.parse(asset.params.metadata);
          baseMetadata.name = onChainMetadata.name || baseMetadata.name;
          if (onChainMetadata.image) {
            imageUrl = await processIPFSUrl(onChainMetadata.image);
          }
        } catch (error) {
          console.error('Error parsing on-chain metadata:', error);
        }
      }

      return {
        assetId: asset['asset-id'],
        metadata: baseMetadata,
        image: imageUrl,
        name: baseMetadata.name
      };
    } catch (error) {
      console.error('Error processing asset:', asset['asset-id'], error);
      return null;
    }
  }, []);

  const loadNFTs = useCallback(async () => {
    if (!walletAddress) return;

    const source = axios.CancelToken.source();
    setCancelToken(source);
    setIsLoading(true);
    setError(null);
    setNfts([]);

    try {
      setProgress('Fetching assets...');
      const response = await indexerAxios.get(
        `${getIndexerURL(network)}/v2/accounts/${walletAddress}/assets`,
        { cancelToken: source.token }
      );

      const assets: Asset[] = response.data.assets;
      const nftAssets = assets.filter(asset => 
        (asset.params?.total === 1 || asset.params?.decimals === 0) &&
        (asset.params?.url || asset.params?.metadata)
      );

      setProgress(`Processing ${nftAssets.length} NFTs...`);
      const processed = await Promise.all(
        nftAssets.map(asset => processAsset(asset, source))
      );

      // Type-safe filtering
      const validNfts = processed.filter((nft): nft is NFT => {
        return !!nft && 
               typeof nft.assetId === 'number' &&
               !!nft.metadata &&
               typeof nft.metadata.name === 'string';
      });

      setNfts(validNfts);
      
      if (validNfts.length === 0) {
        setError('No displayable NFTs found');
      }
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('NFT load error:', error);
        setError('Failed to load NFTs. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setProgress('');
    }
  }, [walletAddress, network, processAsset]);

  useEffect(() => {
    if (isOpen && walletAddress) {
      loadNFTs();
    }
    return () => {
      cancelToken?.cancel('Component unmounted');
    };
  }, [isOpen, walletAddress, loadNFTs, cancelToken]);

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