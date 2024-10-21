"use client";

import { GetServerSideProps } from 'next';
import Dashboard from '../../components/Dashboard';

interface DashboardPageProps {
  username: string;
}

export default function DashboardPage({ username }: DashboardPageProps) {
  return <Dashboard username={username} />;
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
