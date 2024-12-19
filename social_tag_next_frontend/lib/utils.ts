import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getIndexerURL(network: string) {
  return network === 'mainnet' 
    ? 'https://mainnet-idx.algonode.cloud' 
    : 'https://testnet-idx.algonode.cloud';
}
