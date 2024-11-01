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
          className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center p-4 z-50 font-mono"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl border-4 border-black"
          >
            <Card className="w-full border-none bg-transparent">
              <CardHeader className="flex flex-row justify-between items-center bg-[#8B7AB4] p-6 border-b-4 border-black">
                <div>
                  <CardTitle className="text-3xl font-bold text-white tracking-wide">
                    VERIFIED LEADERBOARD
                  </CardTitle>
                  <p className="text-white text-sm mt-1 opacity-90">
                    Ranking of verified users by earned points
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={onClose} 
                  className="text-white hover:bg-[#FF6B6B] hover:text-black border-2 border-white rounded-lg transition-all"
                >
                  <X size={24} />
                </Button>
              </CardHeader>
              <CardContent className="p-0 bg-white">
                {loading && (
                  <div className="text-center py-8 text-black font-bold animate-pulse">
                    LOADING...
                  </div>
                )}
                {error && (
                  <div className="text-center py-8 text-[#FF6B6B] font-bold">
                    {error}
                  </div>
                )}
                {!loading && !error && leaderboard.length === 0 && (
                  <div className="text-center py-8 text-black font-bold">
                    No verified users found
                  </div>
                )}
                {!loading && !error && leaderboard.length > 0 && (
                  <div className="border-4 border-black m-4 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#8B7AB4] border-b-4 border-black">
                          <TableHead className="text-white font-bold">RANK</TableHead>
                          <TableHead className="text-white font-bold">USERNAME</TableHead>
                          <TableHead className="text-white font-bold">NFDOMAIN</TableHead>
                          <TableHead className="text-white font-bold text-right">POINTS</TableHead>
                          <TableHead className="text-white font-bold text-center">PROFILE</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaderboard.map((entry, index) => (
                          <TableRow 
                            key={entry.twitterUsername} 
                            className={`
                              border-b-4 border-black transition-colors
                              ${index % 2 === 0 ? 'bg-white' : 'bg-[#8B7AB4]/10'}
                            `}
                          >
                            <TableCell className="font-bold text-black border-r-4 border-black">
                              {index + 1}
                              {index < 3 && (
                                <span className="ml-2">
                                  {index === 0 && "🥇"}
                                  {index === 1 && "🥈"}
                                  {index === 2 && "🥉"}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-black border-r-4 border-black">
                              <div className="flex items-center space-x-2">
                                <a 
                                  href={`https://x.com/${entry.twitterUsername}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="hover:text-[#FF6B6B] transition-colors inline-flex items-center font-medium"
                                >
                                  @{entry.twitterUsername}
                                </a>
                                <svg 
                                  className="w-4 h-4 text-[#40E0D0]" 
                                  fill="currentColor" 
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                </svg>
                              </div>
                            </TableCell>
                            <TableCell className="text-black border-r-4 border-black">
                              {entry.nfdName || 'N/A'}
                            </TableCell>
                            <TableCell className="text-right border-r-4 border-black">
                              <div className="inline-flex items-center bg-[#FFB951] rounded-lg px-3 py-1 border-2 border-black">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1 text-black">
                                  <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 01-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004zM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 01-.921.42z" />
                                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.816a3.836 3.836 0 00-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 01-.921-.421l-.879-.66a.75.75 0 00-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 001.5 0v-.81a4.124 4.124 0 001.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 00-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 00.933-1.175l-.415-.33a3.836 3.836 0 00-1.719-.755V6z" clipRule="evenodd" />
                                </svg>
                                <span className="font-bold text-black">
                                  {entry.rewardPoints.toLocaleString()}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <a 
                                href={`/socialtag/${entry.twitterUsername}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center bg-[#40E0D0] text-black px-3 py-1 rounded-lg border-2 border-black hover:brightness-110 transition-all"
                              >
                                View <ExternalLink size={16} className="ml-1" />
                              </a>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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