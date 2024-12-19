// nft-utils.ts
export const ARC3_NAME = "arc3";
export const ARC3_NAME_SUFFIX = "@arc3";
export const ARC3_URL_SUFFIX = "#arc3";
export const IPFS_GATEWAY = "https://ipfs.io/ipfs/";
export const IMAGE_PARAMS = "?optimizer=image&width=1152&quality=70";
import { AlgorandAssetWithDetails } from '@/components/CustomizePanel'; // Or wherever your interfaces are defined


export const getIsARC3Asset = (assetInfo: AlgorandAssetWithDetails): boolean => {
    if (!assetInfo || !assetInfo.params) return false;
    
    const assetName = assetInfo.params.name;
    const assetUrl = assetInfo.params.url;
    
    return Boolean(
      assetName === ARC3_NAME || 
      (typeof assetName === 'string' && assetName.endsWith(ARC3_NAME_SUFFIX)) || 
      (typeof assetUrl === 'string' && assetUrl.endsWith(ARC3_URL_SUFFIX))
    );
  }; // Added this closing brace
  
  export const getIsARC19Asset = (assetInfo: AlgorandAssetWithDetails): boolean => {
    const assetUrl = assetInfo.params?.url;
    if (!assetUrl) return false;
    
    return assetUrl.startsWith("template-ipfs://{ipfscid") && 
           assetUrl.includes("reserve");
  };