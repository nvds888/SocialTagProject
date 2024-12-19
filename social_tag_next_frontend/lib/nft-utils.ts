import { AlgorandNFTViewer } from '@gradian/arcviewer';
import { Algodv2 } from 'algosdk';

const IPFS_GATEWAY = "https://ipfs.algonode.dev/ipfs/";
const IMAGE_PARAMS = "?optimizer=image&width=1152&quality=70";

export const getIPFSUrl = (url: string): string => {
  if (url.startsWith('ipfs://')) {
    const cid = url.split('ipfs://')[1].split('#')[0];
    return `${IPFS_GATEWAY}${cid}${IMAGE_PARAMS}`;
  }
  return url;
};

export const getNFTData = async (assetId: number) => {
  try {
    // Initialize Algod client (mainnet)
    const algodClient = new Algodv2('', 'https://mainnet-api.algonode.cloud', '');
    
    // Initialize NFT viewer
    const nftViewer = new AlgorandNFTViewer(algodClient);
    
    // Get NFT metadata
    const nftData = await nftViewer.getNFTAssetData(assetId, true);

    // Get image URL with proper gateway
    let imageUrl = nftData.arcMetadata.httpsImageUrl;
    
    if (imageUrl && imageUrl.includes('ipfs.io')) {
      imageUrl = imageUrl.replace('https://ipfs.io/ipfs/', IPFS_GATEWAY) + IMAGE_PARAMS;
    }

    return {
      id: assetId.toString(),
      name: nftData.params.name,
      image: imageUrl,
      url: nftData.params.url,
      metadata: nftData.arcMetadata
    };
  } catch (error) {
    console.error('Error fetching NFT data:', error);
    return null;
  }
};