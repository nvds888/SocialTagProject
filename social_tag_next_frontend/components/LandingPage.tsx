'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import axios from 'axios'
import { CheckCircle, Twitter, Github, Linkedin, Facebook, Instagram, User, Coins, CreditCard, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'
import SpotifyIcon from '@/components/SpotifyIcon'
import Leaderboard from '@/components/Leaderboard'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

const GradientBackground = () => (
  <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-[#1a1a1a] z-0" />
)

const FeatureIcon = ({ Icon, color }: { Icon: React.ElementType; color: string }) => (
  <div className="icon-wrapper relative group">
    <div className={`absolute inset-0 bg-${color} opacity-20 rounded-full blur-lg transition-all duration-300 group-hover:opacity-30`} />
    <div className="relative transform transition-all duration-300 group-hover:scale-110">
      <Icon size={48} className="feature-icon text-[#4FFFD1]" strokeWidth={1.5} />
    </div>
  </div>
)

const LandingPage: React.FC = () => {
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const featuresRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/checkAuth`, { withCredentials: true })
        setIsAuthenticated(response.data.isAuthenticated)
        setUsername(response.data.username)
      } catch (error) {
        console.error('Error checking auth status:', error)
      }
    }
    checkAuthStatus()
  }, [])

  const handleCreateProfileClick = () => setShowPopup(true)
  const handleTwitterAuth = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/twitter`
  }
  const openLeaderboard = () => setShowLeaderboard(true)
  const closeLeaderboard = () => setShowLeaderboard(false)

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <GradientBackground />
      
      <div className="relative z-10">
        <header className="flex justify-between items-center p-4 border-b border-white/10">
          <div className="flex items-center">
            <h1 className="text-4xl font-bold text-white">Splash Protocol</h1>
            <div className="ml-2 px-2 py-1 bg-[#4FFFD1] text-xs font-semibold text-black rounded-md">
              BETA
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={openLeaderboard}
              className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5 transition-all flex items-center text-white"
            >
              Leaderboard
            </button>
          </div>

          {isAuthenticated && username && (
            <motion.div 
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50 bg-[#4FFFD1] text-black py-2 px-4 flex items-center justify-center rounded-b-lg"
            >
              <div className="flex items-center space-x-4">
                <User size={16} />
                <span className="text-sm">@{username}</span>
                <Link 
                  href={`/dashboard/${username}`}
                  className="bg-black text-white px-3 py-1 rounded-lg hover:bg-black/80 transition-all"
                >
                  Dashboard
                </Link>
              </div>
            </motion.div>
          )}
        </header>

        <main className="container mx-auto px-4">
          <div className="hero-section text-center mt-20 mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl font-bold mb-8"
            >
              The Social & Cashback
              <span className="text-[#4FFFD1]"> Protocol</span>
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl mb-12 max-w-2xl mx-auto text-white/80"
            >
              Create your social profile, earn rewards, and join the future of social engagement
            </motion.p>

            <motion.button
              onClick={handleCreateProfileClick}
              className="bg-[#4FFFD1] text-black px-8 py-3 rounded-lg text-lg font-semibold hover:bg-[#4FFFD1]/90 transition-all"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              Get Started
            </motion.button>

            <div className="mt-8 flex justify-center gap-6 text-white/60">
              <Twitter size={24} />
              <Github size={24} />
              <Image 
                src="/nfdomaindark.png" 
                alt="NFDomain"
                width={24}
                height={24}
                className="invert"
              />
              <Linkedin size={24} />
              <SpotifyIcon size={24} />
              <Facebook size={24} />
              <Instagram size={24} />
            </div>
          </div>

          <section ref={featuresRef} className="features-section mb-20">
            <h2 className="text-3xl font-bold text-center mb-16">Key Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <motion.div 
                className="feature-card bg-white/5 p-8 rounded-2xl border border-white/10 hover:border-[#4FFFD1]/30 transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <FeatureIcon Icon={CheckCircle} color="[#4FFFD1]" />
                <h3 className="text-xl font-semibold mb-4 mt-6">Verified Identity</h3>
                <p className="text-white/60">Secure, blockchain-verified social profiles with seamless API integration</p>
              </motion.div>

              <motion.div 
                className="feature-card bg-white/5 p-8 rounded-2xl border border-white/10 hover:border-[#4FFFD1]/30 transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <FeatureIcon Icon={CreditCard} color="[#4FFFD1]" />
                <h3 className="text-xl font-semibold mb-4 mt-6">Social Rewards</h3>
                <p className="text-white/60">Earn rewards through social engagement and spending</p>
              </motion.div>

              <motion.div 
                className="feature-card bg-white/5 p-8 rounded-2xl border border-white/10 hover:border-[#4FFFD1]/30 transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <FeatureIcon Icon={Coins} color="[#4FFFD1]" />
                <h3 className="text-xl font-semibold mb-4 mt-6">Reward Pools</h3>
                <p className="text-white/60">Access multiple reward pools and earn different tokens based on activity</p>
              </motion.div>
            </div>
          </section>

          <section className="rewards-section mb-20">
          <div className="max-w-4xl mx-auto bg-white/5 rounded-3xl p-12 border border-white/10 relative">
    <div className="absolute -right-4 top-8 transform rotate-12">
      <div className="bg-[#4FFFD1] text-black px-8 py-2 rounded-lg font-bold shadow-lg">
        Coming Soon
      </div>
    </div>

              <h2 className="text-4xl font-bold mb-8 text-center">Cashback for debit card purchases</h2>
              <p className="text-xl mb-12 text-center text-white/80">
                Bridging memes with the real-world through blockchain technology
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                  <h3 className="text-2xl font-bold mb-4">Ease of use</h3>
                  <p className="text-white/60">Registration is completed under a minute</p>
                </div>
                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                  <h3 className="text-2xl font-bold mb-4">Multiple Pools</h3>
                  <p className="text-white/60">Access various ASAreward pools with different token rewards</p>
                </div>
                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                  <h3 className="text-2xl font-bold mb-4">Spend & Earn</h3>
                  <p className="text-white/60">Earn rewards on everyday purchases</p>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-white/10 py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">About Us</h3>
                <p className="text-white/60">Splash Protocol: Redefining rewards on Algorand.</p>
                <div className="flex items-center mt-4 space-x-4">
                  <a href="https://x.com/SocialT_ag" target="_blank" rel="noopener noreferrer" 
                     className="text-white/60 hover:text-[#4FFFD1] transition-colors">
                    <Twitter size={20} />
                  </a>
                  <a href="https://vestige.fi/asset/2607097066" target="_blank" rel="noopener noreferrer"
                     className="text-white/60 hover:text-[#4FFFD1] transition-colors">
                    <BarChart3 size={20} />
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/privacy" className="text-white/60 hover:text-[#4FFFD1] transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-white/60 hover:text-[#4FFFD1] transition-colors">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link href="/$socials_token_litepaper.pdf" className="text-white/60 hover:text-[#4FFFD1] transition-colors">
                      $socials Litepaper
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Connect</h3>
                <div className="flex space-x-4">
                  <Twitter size={24} className="text-white/60 hover:text-[#4FFFD1] transition-colors" />
                  <Github size={24} className="text-white/60 hover:text-[#4FFFD1] transition-colors" />
                  <SpotifyIcon size={24} />
                  <Linkedin size={24} className="text-white/60 hover:text-[#4FFFD1] transition-colors" />
                  <Facebook size={24} className="text-white/60 hover:text-[#4FFFD1] transition-colors" />
                  <Instagram size={24} className="text-white/60 hover:text-[#4FFFD1] transition-colors" />
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-white/10 text-center">
              <p className="text-white/60">&copy; 2024 Splash Protocol. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Modals */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <motion.div
            className="bg-white/10 p-8 rounded-lg backdrop-blur-xl border border-white/20 max-w-md w-full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-2xl font-bold mb-6 text-center text-white">Sign Up / In</h3>
            <button
              className="bg-[#4FFFD1] text-black w-full px-4 py-3 rounded-lg hover:bg-[#4FFFD1]/90 transition-all flex items-center justify-center text-lg font-semibold"
              onClick={handleTwitterAuth}
            >
              <Twitter size={24} className="mr-2" />
              Continue with X
            </button>
            <button
              className="close-popup absolute top-4 right-4 text-white/60 hover:text-white transition-all w-8 h-8 rounded-lg flex items-center justify-center"
              onClick={() => setShowPopup(false)}
            >
              ×
            </button>
          </motion.div>
        </div>
      )}

      {showVideoModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white/10 p-6 rounded-lg max-w-4xl w-full border border-white/20 relative">
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute -top-4 -right-4 w-8 h-8 bg-[#4FFFD1] text-black rounded-full flex items-center justify-center hover:bg-[#4FFFD1]/90 transition-colors"
            >
              ×
            </button>
            <div className="relative rounded-lg overflow-hidden aspect-video">
              <video
                className="w-full h-full"
                controls
                autoPlay
                playsInline
              >
                <source src="/SocialTag-Veed.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}

      <Leaderboard isOpen={showLeaderboard} onClose={closeLeaderboard} />

      <style jsx>{`
        .bounce {
          animation: bounce 2s infinite;
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  )
}

export default LandingPage