import { AlgorandAssetWithDetails } from '@/components/CustomizePanel';

export const ARC3_NAME = "arc3";
export const ARC3_NAME_SUFFIX = "@arc3";
export const ARC3_URL_SUFFIX = "#arc3";
export const IPFS_GATEWAY = "https://ipfs.io/ipfs/";
export const IMAGE_PARAMS = "?optimizer=image&width=1152&quality=70";


// Helper function to assert value is defined
function AssertDefined<T>(value: T | undefined | null, message: string): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(message);
  }
}

// Convert IPFS URL to HTTPS
export const convertIpfsToHttps = (url: string | undefined): string | null => {
  if (!url) return null;

  try {
    // Handle template-ipfs protocol first
    if (url.startsWith('template-ipfs://')) {
      return arcResolveProtocol(url);
    }

    // Handle IPFS protocol
    if (url.startsWith('ipfs://')) {
      const cid = url.split('ipfs://')[1].split('#')[0];
      return `${IPFS_GATEWAY}${cid}${IMAGE_PARAMS}`;
    }

    // Handle existing IPFS gateway URLs
    if (url.includes('/ipfs/')) {
      const cid = url.split('/ipfs/')[1].split('?')[0].split('#')[0];
      return `${IPFS_GATEWAY}${cid}${IMAGE_PARAMS}`;
    }

    // Handle bare CIDs
    if (url.match(/^(bafy|Qm|baik)[a-zA-Z0-9]{44,}/)) {
      const cid = url.split('#')[0];
      return `${IPFS_GATEWAY}${cid}${IMAGE_PARAMS}`;
    }

    // Handle ARC3 URL suffix
    if (url.endsWith(ARC3_URL_SUFFIX)) {
      return url.slice(0, url.length - ARC3_URL_SUFFIX.length);
    }

    // Return other URLs as-is
    return url;
  } catch (error) {
    console.warn('Error processing IPFS URL:', url, error);
    return null;
  }
};

// Handle template-ipfs URLs
function arcResolveProtocol(url: string, reserveAddr?: string): string {
  if (url.endsWith(ARC3_URL_SUFFIX)) {
    url = url.slice(0, url.length - ARC3_URL_SUFFIX.length);
  }

  const chunks = url.split("://");
  AssertDefined(chunks[1], "Invalid URL format");

  // Check if prefix is template-ipfs and if {ipfscid:..} is present
  if (chunks[0] === "template-ipfs" && chunks[1].startsWith("{ipfscid:")) {
    // Parse the template format
    const cidComponents = chunks[1].split(":");
    if (cidComponents.length !== 5) {
      console.log("Unknown ipfscid format");
      return url;
    }

    const [, cidCodec, asaField, cidHash] = cidComponents as [string, string, string, string, string];
    const hashType = cidHash.split("}")[0];

    // Basic validation
    if (hashType !== "sha2-256" || 
        (cidCodec !== "raw" && cidCodec !== "dag-pb") || 
        asaField !== "reserve") {
      console.log("Unsupported format");
      return url;
    }

    // For template URLs without reserve address, return gateway URL
    if (!reserveAddr) {
      return `${IPFS_GATEWAY}${chunks[1]}${IMAGE_PARAMS}`;
    }

    // Here you would normally use algosdk to decode the reserve address
    // and create a CID, but since we want to avoid the dependency,
    // we'll return a gateway URL
    return `${IPFS_GATEWAY}${chunks[1]}${IMAGE_PARAMS}`;
  }

  switch (chunks[0]) {
    case "ipfs": 
      return `${IPFS_GATEWAY}${chunks[1]}`;
    case "https":
      return url;
    default:
      return url;
  }
}

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