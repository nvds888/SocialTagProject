'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import axios from 'axios'
import { CheckCircle, ChevronDown, Twitter, Github, Linkedin, Facebook, Instagram, User, Coins } from 'lucide-react'
import { motion } from 'framer-motion'
import SpotifyIcon from '@/components/SpotifyIcon' 
import Leaderboard from '@/components/Leaderboard'
import LavaEffect from '@/components/LavaEffect'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

const FeatureIcon = ({ Icon, color }: { Icon: React.ElementType; color: string }) => (
  <div className="icon-wrapper relative group">
    <div className={`absolute inset-0 bg-${color} opacity-10 rounded-full blur-xl transition-all duration-300 group-hover:opacity-20 group-hover:blur-2xl`} />
    <div className="relative transform transition-all duration-300 group-hover:scale-110">
      <Icon size={48} className="feature-icon text-white" strokeWidth={1.5} />
    </div>
  </div>
)

export default function LandingPage() {
  const [showPopup, setShowPopup] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const featuresRef = useRef<HTMLElement>(null)
  const aboutRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

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

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5,
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && videoRef.current) {
          videoRef.current.play()
        } else if (videoRef.current) {
          videoRef.current.pause()
        }
      })
    }, options)

    if (videoRef.current) {
      observer.observe(videoRef.current)
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current)
      }
    }
  }, [])

  const handleCreateProfileClick = () => {
    setShowPopup(true)
  }

  const handleTwitterAuth = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/twitter`
  }

  const handleDashboardClick = () => {
    if (isAuthenticated && username) {
      window.location.href = `/dashboard/${username}`
    } else {
      setShowPopup(true)
    }
  }

  const openLeaderboard = () => setShowLeaderboard(true)
  const closeLeaderboard = () => setShowLeaderboard(false)

  return (
    <div className="landing-container min-h-screen bg-white text-black relative overflow-hidden">
      <div className="relative z-10">
        <header className="landing-header flex justify-between items-center p-4 bg-white bg-opacity-90">
          <h1 className="logo text-4xl font-bold text-black">SocialTag</h1>

          <div className="header-buttons flex space-x-4">
            <button 
              onClick={openLeaderboard} 
              className="nav-button bg-white text-black px-4 py-2 rounded-full hover:bg-opacity-50 transition-colors flex items-center"
            >
              <strong>Leaderboard</strong>
            </button>
            {isAuthenticated ? (
              <Link href={`/dashboard/${username}`} className="nav-button bg-white text-black px-4 py-2 rounded-full hover:bg-opacity-50 transition-colors">
                <strong>My Dashboard</strong>
              </Link>
            ) : (
              <button 
                onClick={handleDashboardClick}
                className="nav-button bg-transparent text-black px-4 py-2 rounded-none hover:bg-opacity-50 transition-colors"
              >
                <strong>Sign In</strong>
              </button>
            )}
          </div>
        </header>
        <main className="landing-main">
          <div className="hero-content text-center mt-20 mb-12">
            <h2 className="hero-title text-5xl font-bold mb-6 text-black">
              Authentic <span className="relative">
                You
                <motion.span
                  className="absolute bottom-0 left-0 w-full h-2 bg-[#40E0D0] rounded-sm"
                  initial={{ width: 0 }}
                  animate={{ width: ['0%', '110%', '110%'] }}
                  transition={{
                    duration: 2,
                    times: [0, 0.2, 0.8, 0.8001],
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                />
              </span>.<br />
              One Tag, <span className="relative">
                Zero Imposters
                <motion.span
                  className="absolute bottom-0 left-0 w-full h-2 bg-[#40E0D0] rounded-sm"
                  initial={{ width: 0 }}
                  animate={{ width: ['0%', '0%', '110%', '110%'] }}
                  transition={{
                    duration: 2,
                    times: [0, 0.2, 0.4, 0.8, 0.8001],
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                />
              </span>.
            </h2>
            <motion.p 
              className="hero-subtitle text-xl mb-8 max-w-2xl mx-auto text-gray-600"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
             Deploy your public profile: your personalized, blockchain-verified SocialTag.
             Fully customizable, secure, and built with integrity. 
             Think of it as Linktree, but redefined with trust and transparency.
            </motion.p>
            <motion.button
              className="create-profile-button bg-[#FF6B6B] text-white px-8 py-3 rounded-none text-lg font-semibold hover:bg-opacity-90 transition-colors relative overflow-hidden mb-6"
              onClick={handleCreateProfileClick}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              Sign Up / In
            </motion.button>
            <div className="social-icons flex justify-center space-x-4">
              <Twitter size={24} className="text-black" />
              <Github size={24} className="text-black" />
              <SpotifyIcon size={24} />
              <Linkedin size={24} className="text-black" />
              <Facebook size={24} className="text-black" />
              <Instagram size={24} className="text-black" />
            </div>
          </div>
          <div className="scroll-indicator text-center mb-12">
            <p className="mb-2 text-gray-600">Scroll to learn more</p>
            <ChevronDown size={32} className="bounce mx-auto text-black" />
          </div>

          {/* About Section */}
          <section ref={aboutRef} className="about-section mb-20">
          <div className="bg-[#9B8AC4] rounded-3xl px-8 py-12 max-w-4xl mx-auto border-4 border-black shadow-lg">
              <div className="max-w-2xl mx-auto">
                <div className="relative rounded-lg overflow-hidden shadow-2xl">
                  <video
                    ref={videoRef}
                    className="w-full h-auto rounded-lg"
                    playsInline
                    muted
                    loop
                    controls
                    preload="metadata"
                  >
                    <source src="/SocialTag-Veed.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  <noscript>
                    <Image 
                      src="/placeholder.svg?height=300&width=600" 
                      alt="About SocialTag" 
                      width={600} 
                      height={300} 
                      className="rounded-lg shadow-lg"
                    />
                  </noscript>
                </div>
              </div>
            </div>
          </section>

          {/* Modernized Features Section */}
          <section ref={featuresRef} className="features-section relative mb-20 min-h-[600px] overflow-hidden">
            <div className="absolute inset-0">
              <LavaEffect />
            </div>
            
            <div className="relative z-10 px-4 py-16">
              <h2 className="section-title text-4xl font-bold text-center mb-16 text-white">
                Key Features
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                <motion.div 
                  className="feature-card backdrop-blur-md bg-[#FFB951]/40 p-8 rounded-2xl border border-[#FFB951]/50 shadow-xl hover:shadow-2xl transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <FeatureIcon Icon={CheckCircle} color="#FFB951" />
                  <h3 className="text-xl font-semibold mb-4 text-black mt-6">Authentic You</h3>
                  <p className="text-black">Safeguard your online presence with API authentication and blockchain verification, ensuring your identity is always authentic. No blockchain expertise or wallet required to get started.</p>
                </motion.div>

                <motion.div 
                  className="feature-card backdrop-blur-md bg-[#40E0D0]/40 p-8 rounded-2xl border border-[#40E0D0]/50 shadow-xl hover:shadow-2xl transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  whileHover={{ y: -5 }}
                >
                  <FeatureIcon Icon={User} color="#40E0D0" />
                  <h3 className="text-xl font-semibold mb-4 text-black mt-6">Customize Your &apos;Tag&apos;</h3>
                  <p className="text-black">Take charge of your online presence. Choose from diverse cards and backgrounds to convey your authentic self. Use an NFT as your profile picture, link your NFDomain, and unlock even more ways to personalize!</p>
                </motion.div>

                <motion.div 
                  className="feature-card backdrop-blur-md bg-[#FF6B6B]/40 p-8 rounded-2xl border border-[#FF6B6B]/50 shadow-xl hover:shadow-2xl transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  whileHover={{ y: -5 }}
                >
                  <FeatureIcon Icon={Coins} color="#FF6B6B" />
                  <h3 className="text-xl font-semibold mb-4 text-black mt-6">Earn Reward Points</h3>
                  <p className="text-black">Earn reward points for a multitude of actions on the platform. Your rewards can be used to unlock special edition items in the marketplace and to excel on the leaderboard!</p>
                </motion.div>
              </div>
            </div>
          </section>
        </main>

        <footer className="landing-footer text-center p-6 bg-black text-white">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">About Us</h3>
                <p className="text-sm">SocialTag: Authentic You. One Tag, Zero Imposters. This App uses the Algorand blockchain.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                <ul className="text-sm">
                  <li><a href="#" className="hover:text-gray-300">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-gray-300">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-gray-300">Contact Us</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Connect with official APIs</h3>
                <div className="flex justify-center space-x-4">
                  <a className="text-white hover:text-gray-300">
                    <Twitter size={24} />
                  </a>
                  <a className="text-white hover:text-gray-300">
                    <Github size={24} />
                  </a>
                  <a className="text-white hover:text-gray-300">
                    <SpotifyIcon size={24} />
                  </a>
                  <a className="text-white hover:text-gray-300">
                    <Linkedin size={24} />
                  </a>
                  <a className="text-white hover:text-gray-300">
                    <Facebook size={24} />
                  </a>
                  <a className="text-white hover:text-gray-300">
                    <Instagram size={24} />
                  </a>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-700">
              <p className="text-sm">&copy; 2024 SocialTag. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>

      {showPopup && (
        <div className="popup-overlay fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
        <motion.div 
          className="popup-content bg-white text-black p-8 rounded-lg relative max-w-md w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-2xl font-bold mb-6 text-center">Sign Up / In</h3>
          <button
            className="twitter-auth-button bg-[#FF6B6B] text-white w-full px-4 py-3 rounded-none flex items-center justify-center text-lg font-semibold hover:bg-opacity-80 transition-colors"
            onClick={handleTwitterAuth}
          >
            <Twitter size={24} className="mr-2" />
            Proceed with X
          </button>
          <button
            className="close-popup absolute top-2 right-2 text-2xl text-black hover:text-gray-600 transition-colors"
            onClick={() => setShowPopup(false)}
          >
            &times;
          </button>
        </motion.div>
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