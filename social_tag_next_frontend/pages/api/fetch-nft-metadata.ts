
import { NextApiRequest, NextApiResponse } from 'next';
import { Algodv2 } from 'algosdk';
import { AlgorandNFTViewer } from '@gradian/arcviewer';

// Initialize Algorand client
const initAlgorandClient = () => {
  const server = process.env.NEXT_PUBLIC_ALGOD_SERVER || 'https://mainnet-api.algonode.cloud';
  const port = process.env.NEXT_PUBLIC_ALGOD_PORT || '';
  const token = process.env.NEXT_PUBLIC_ALGOD_TOKEN || '';
  
  return new Algodv2(token, server, port);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { assetIds } = req.body;

  if (!Array.isArray(assetIds)) {
    return res.status(400).json({ error: 'assetIds must be an array' });
  }

  try {
    const algodClient = initAlgorandClient();
    const nftViewer = new AlgorandNFTViewer(algodClient);
    
    const metadataPromises = assetIds.map(async (assetId) => {
      try {
        const assetMetadata = await nftViewer.getNFTAssetData(Number(assetId), true);
        
        return {
          id: assetId.toString(),
          metadata: assetMetadata.arcMetadata,
          imageUrl: assetMetadata.arcMetadata.httpsImageUrl,
          name: assetMetadata.params.name || `Asset #${assetId}`,
          unitName: assetMetadata.params.unitName || '',
        };
      } catch (error) {
        console.error(`Error fetching metadata for asset ${assetId}:`, error);
        return null;
      }
    });

    const metadata = (await Promise.all(metadataPromises)).filter(Boolean);
    return res.status(200).json(metadata);
  } catch (error) {
    console.error('Error processing NFT metadata:', error);
    return res.status(500).json({ error: 'Failed to fetch NFT metadata' });
  }
}