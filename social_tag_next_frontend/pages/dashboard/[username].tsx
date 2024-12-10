'use client';

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Dashboard from '../../components/Dashboard';

export default function DashboardPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (router.isReady) {
      const { username: routeUsername } = router.query;
      setUsername(Array.isArray(routeUsername) ? routeUsername[0] : routeUsername || null);
    }
  }, [router.isReady, router.query]);

  if (!username) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <link rel="icon" href="/SocialTag.png" type="image/png" />
        <title>SocialTag</title>
      </Head>
      <Dashboard username={username as string} />
    </>
  );
}