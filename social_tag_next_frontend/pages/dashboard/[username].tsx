import { useRouter } from 'next/router';
import Dashboard from '../../components/Dashboard'; // Adjust the import path as needed

export default function DashboardPage() {
  const router = useRouter();

  if (!router.isReady) {
    return <div>Loading...</div>;
  }

  return <Dashboard {...router.query} />;
}
