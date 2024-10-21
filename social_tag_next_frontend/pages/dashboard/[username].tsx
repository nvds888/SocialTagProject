import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const DashboardComponent = dynamic(
  () => import('../../components/Dashboard'),
  { ssr: false }
);

export default function DashboardPage() {
  const router = useRouter();

  if (!router.isReady) {
    return <div>Loading...</div>;
  }

  return (
    <Suspense fallback={<div>Loading Dashboard...</div>}>
      <DashboardComponent {...router.query} />
    </Suspense>
  );
}