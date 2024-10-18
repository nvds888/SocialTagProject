'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

interface SearchParamsHandlerProps {
  onAuthStatusChange: (authStatus: string | null, platform: string | null) => void;
}

export default function SearchParamsHandler({ onAuthStatusChange }: SearchParamsHandlerProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams) { // Check if searchParams is not null
      const authStatus = searchParams.get('auth_status');
      const platform = searchParams.get('platform');
      onAuthStatusChange(authStatus, platform);
    }
  }, [searchParams, onAuthStatusChange]);

  return null;
}
