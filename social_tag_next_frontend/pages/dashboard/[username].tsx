import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the Dashboard component with SSR disabled
const DashboardComponent = dynamic(() => import('../../components/Dashboard'), {
  ssr: false,
});

// Wrapper component
function DashboardWrapper(props: Record<string, unknown>) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardComponent {...props} />
    </Suspense>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  if (!router.isReady) {
    return <div>Loading...</div>;
  }

  return <DashboardWrapper {...router.query} />;
}
