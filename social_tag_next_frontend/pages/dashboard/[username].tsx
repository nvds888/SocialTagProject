import { GetServerSideProps } from 'next';
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

export default function DashboardPage(props: Record<string, unknown>) {
  return <DashboardWrapper {...props} />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { username } = context.params || {};
  
  // Fetch any necessary data here
  // For example, you might want to fetch user data from your API
  // const userData = await fetchUserData(username);
  
  return {
    props: {
      username,
      // Add other props as needed
      // userData,
    },
  };
};
