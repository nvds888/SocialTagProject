import { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';

// Dynamically import the Dashboard component with SSR disabled
const DashboardComponent = dynamic(() => import('../../components/Dashboard'), {
  ssr: false,
});

interface DashboardPageProps {
  username: string;
}

export default function DashboardPage({ username }: DashboardPageProps) {
  return <DashboardComponent username={username} />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { username } = context.params || {};
  
  if (typeof username !== 'string') {
    return {
      notFound: true,
    };
  }
  
  // You can add additional server-side checks here if needed
  // For example, you might want to verify if the username exists in your database
  
  return {
    props: {
      username,
    },
  };
};
