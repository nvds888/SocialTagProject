import { AlgorandAssetWithDetails } from '@/components/CustomizePanel';

export const ARC3_NAME = "arc3";
export const ARC3_NAME_SUFFIX = "@arc3";
export const ARC3_URL_SUFFIX = "#arc3";
export const IPFS_GATEWAY = "https://ipfs.io/ipfs/";
export const IMAGE_PARAMS = "?optimizer=image&width=1152&quality=70";

export const getIsARC3Asset = (assetInfo: AlgorandAssetWithDetails): boolean => {
  if (!assetInfo || !assetInfo.params) return false;
  
  const assetName = assetInfo.params.name;
  const assetUrl = assetInfo.params.url;
  
  const isArc3ByName = Boolean(
    assetName === ARC3_NAME || 
    (typeof assetName === 'string' && assetName.endsWith(ARC3_NAME_SUFFIX))
  );
  const isArc3ByUrl = Boolean(assetUrl && assetUrl.endsWith(ARC3_URL_SUFFIX));

  return isArc3ByName || isArc3ByUrl;
};

export const getIsARC19Asset = (assetInfo: AlgorandAssetWithDetails): boolean => {
  const assetUrl = assetInfo.params?.url;
  if (!assetUrl) return false;
  
  const followsTemplateIPFSArc19Spec = assetUrl.startsWith("template-ipfs://{ipfscid");
  const containsReserveKeyword = assetUrl.includes("reserve");
  
  return followsTemplateIPFSArc19Spec && containsReserveKeyword;
};