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
  verified: boolean;
  lastVerified: string;
  totalUsdSpent: number; 
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
  const [sortBy, setSortBy] = useState<'points' | 'spent'>('points');

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboardData();
    }
  }, [isOpen]);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/leaderboard`);
      setLeaderboard(response.data);
    } catch (err) {
      console.error('Error fetching leaderboard data:', err);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = (newSortBy: 'points' | 'spent') => {
    setSortBy(newSortBy);
    const sortedData = [...leaderboard].sort((a: LeaderboardEntry, b: LeaderboardEntry) => 
      newSortBy === 'points' 
        ? b.rewardPoints - a.rewardPoints 
        : b.totalUsdSpent - a.totalUsdSpent
    );
    setLeaderboard(sortedData);
  };

  // Reduced max height for better UI when scrolling
  const getTableContainerStyle = () => {
    if (leaderboard.length <= 6) {
      return "";
    }
    return "max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#8B7AB4] scrollbar-track-transparent";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center p-4 z-50 font-mono"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            // Reduced max width and border size for sleeker look
            className="w-full max-w-3xl bg-white rounded-lg shadow-xl border-2 border-black"
          >
            <Card className="w-full border-none bg-transparent">
              {/* Reduced padding and simplified header */}
              <CardHeader className="flex flex-row justify-between items-center bg-[#8B7AB4] p-4 border-b-2 border-black">
                <div>
                <CardTitle className="text-2xl font-bold text-white tracking-wide">
  VERIFIED LEADERBOARD
</CardTitle>
<div className="flex gap-2 mt-2">
  <Button
    variant="ghost" 
    onClick={() => toggleSort('points')}
    className={`text-xs border ${sortBy === 'points' ? 'bg-white text-black' : 'text-white border-white'} rounded-lg transition-all`}
  >
    Sort by Points
  </Button>
  <Button
    variant="ghost"
    onClick={() => toggleSort('spent')}
    className={`text-xs border ${sortBy === 'spent' ? 'bg-white text-black' : 'text-white border-white'} rounded-lg transition-all`}
  >
    Sort by USD Spent
  </Button>
</div>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={onClose} 
                  className="text-white hover:bg-[#FF6B6B] hover:text-black border border-white rounded-lg transition-all"
                >
                  <X size={20} />
                </Button>
              </CardHeader>

              <CardContent className="p-0 bg-white">
                {loading && (
                  <div className="text-center py-6 text-black font-bold animate-pulse">
                    LOADING...
                  </div>
                )}

                {error && (
                  <div className="text-center py-6 text-[#FF6B6B] font-bold">
                    {error}
                  </div>
                )}

                {!loading && !error && leaderboard.length === 0 && (
                  <div className="text-center py-6 text-black font-bold">
                    No verified users found
                  </div>
                )}

                {!loading && !error && leaderboard.length > 0 && (
                  <div className="border-2 border-black m-2 rounded-lg overflow-hidden">
                    <div className={getTableContainerStyle()}>
                      <Table>
                        <TableHeader className={leaderboard.length > 6 ? "sticky top-0 z-10" : ""}>
                          <TableRow className="bg-[#8B7AB4] border-b-2 border-black">
                            <TableHead className="text-white font-bold text-sm py-2">RANK</TableHead>
                            <TableHead className="text-white font-bold text-sm py-2">USERNAME</TableHead>
                            <TableHead className="text-white font-bold text-sm py-2">NFDOMAIN</TableHead>
                            <TableHead className="text-white font-bold text-sm py-2 text-right">POINTS</TableHead>
                            <TableHead className="text-white font-bold text-sm py-2 text-right">USD SPENT</TableHead>
                            <TableHead className="text-white font-bold text-sm py-2 text-center">PROFILE</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leaderboard.map((entry, index) => (
                            <TableRow 
                              key={entry.twitterUsername} 
                              className={`
                                border-b border-black/20 transition-colors h-[60px]
                                ${index % 2 === 0 ? 'bg-white' : 'bg-[#8B7AB4]/5'}
                                ${index === leaderboard.length - 1 ? 'border-b-0' : ''}
                                hover:bg-[#8B7AB4]/10 transition-colors
                              `}
                            >
                              {/* Rank Cell */}
                              <TableCell className="font-bold text-black text-sm">
                                {index + 1}
                                {index < 3 && (
                                  <span className="ml-2">
                                    {index === 0 && "🥇"}
                                    {index === 1 && "🥈"}
                                    {index === 2 && "🥉"}
                                  </span>
                                )}
                              </TableCell>

                              {/* Username Cell */}
                              <TableCell className="text-black text-sm">
                                <a 
                                  href={`https://x.com/${entry.twitterUsername}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="hover:text-[#FF6B6B] transition-colors inline-flex items-center"
                                >
                                  @{entry.twitterUsername}
                                </a>
                              </TableCell>

                              {/* NFDomain Cell */}
                              <TableCell className="text-black text-sm">
                                {entry.nfdName || '-'}
                              </TableCell>

                              {/* Points Cell */}
                              <TableCell className="text-right">
                                <div className="inline-flex items-center bg-[#FFB951]/90 rounded-md px-2 py-1 border border-black text-sm">
                                  <span className="font-bold text-black">
                                    {entry.rewardPoints.toLocaleString()}
                                  </span>
                                </div>
                              </TableCell>

                              <TableCell className="text-right">
  <div className="inline-flex items-center bg-[#40E0D0]/90 rounded-md px-2 py-1 border border-black text-sm">
    <span className="font-bold text-black">
      ${entry.totalUsdSpent?.toLocaleString() || '0'}
    </span>
  </div>
</TableCell>

                              {/* Profile Link Cell */}
                              <TableCell className="text-center">
                                <a 
                                  href={`/socialtag/${entry.twitterUsername}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center bg-[#40E0D0]/90 text-black px-2 py-1 rounded-md border border-black hover:brightness-110 transition-all text-sm"
                                >
                                  View <ExternalLink size={14} className="ml-1" />
                                </a>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
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