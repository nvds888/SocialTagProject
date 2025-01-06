export interface User {
  twitter?: { username: string };
  facebook?: { name: string };
  linkedin?: { name: string };
  github?: { username: string };
  spotify?: { id: string; username: string };
  theme?: string;
  cardStyle?: string;
  bio?: string;
  purchasedItems?: string[];
  profileImage?: string;
  profileViews?: number;
  nfd?: {
      id: string;
      name: string;
      assetId?: string;
  };
  profileNFT?: NFT;
  rewardPoints: number;
  verifications?: Verification[];
}
  
  export interface Verification {
    timestamp: string;
    algorandTransactionId?: string;
    isPermanentafy?: boolean;
    assetId?: number;
  }
  
  export interface NFT {
    id: string;
    name: string;
    url?: string;
    'metadata-hash'?: string;
    reserve?: string;
    image?: string;
    assetId?: string;
  }
  
  // Add any other shared interfaces here