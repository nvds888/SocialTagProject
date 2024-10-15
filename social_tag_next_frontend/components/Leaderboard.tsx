import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ExternalLink } from 'lucide-react';

interface LeaderboardEntry {
  twitterUsername: string;
  nfdName: string | null;
  rewardPoints: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ isOpen, onClose }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboardData();
    }
  }, [isOpen]);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/leaderboard`);
      const sortedData = response.data.sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.rewardPoints - a.rewardPoints);
      setLeaderboard(sortedData);
    } catch (err) {
      console.error('Error fetching leaderboard data:', err);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-lg shadow-xl"
          >
            <Card className="w-full bg-gray-900 text-white border-none">
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="text-3xl font-bold">Leaderboard</CardTitle>
                <Button variant="ghost" onClick={onClose} className="text-white">
                  <X size={24} />
                </Button>
              </CardHeader>
              <CardContent>
                {loading && <div className="text-center py-4">Loading...</div>}
                {error && <div className="text-center py-4 text-red-500">{error}</div>}
                {!loading && !error && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-white">Rank</TableHead>
                        <TableHead className="text-white">X Username</TableHead>
                        <TableHead className="text-white">NFDomain</TableHead>
                        <TableHead className="text-white text-right">Reward Points</TableHead>
                        <TableHead className="text-white text-center">Profile</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboard.map((entry, index) => (
                        <TableRow key={entry.twitterUsername} className="hover:bg-gray-800">
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="text-blue-400">
                            <a 
                              href={`https://x.com/${entry.twitterUsername}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              @{entry.twitterUsername}
                            </a>
                          </TableCell>
                          <TableCell>{entry.nfdName || 'N/A'}</TableCell>
                          <TableCell className="text-right font-bold text-yellow-400">{entry.rewardPoints}</TableCell>
                          <TableCell className="text-center">
                            <a 
                              href={`http://localhost:3000/socialtag/${entry.twitterUsername}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline inline-flex items-center"
                            >
                              View <ExternalLink size={16} className="ml-1" />
                            </a>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Leaderboard;