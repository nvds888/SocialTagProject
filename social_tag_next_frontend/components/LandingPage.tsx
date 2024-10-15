'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Shield, CheckCircle, Lock, ChevronDown, Twitter, Github, Linkedin, Facebook, Instagram } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import SpotifyIcon from '@/components/SpotifyIcon' 
import Leaderboard from '@/components/Leaderboard'

const FeatureIcon = ({ Icon }: { Icon: React.ElementType }) => (
  <div className="icon-wrapper bg-gray-100 rounded-full p-4">
    <Icon size={32} className="feature-icon text-black" />
  </div>
)

export default function LandingPage() {
  const [showPopup, setShowPopup] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const featuresRef = useRef<HTMLElement>(null)
  const aboutRef = useRef<HTMLElement>(null)
  const testimonialsRef = useRef<HTMLElement>(null)

  const handleCreateProfileClick = () => {
    setShowPopup(true)
  }

  const handleTwitterAuth = () => {
    window.location.href = 'http://localhost:5000/auth/twitter'
  }

  const scrollToSection = (ref: React.RefObject<HTMLElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const openLeaderboard = () => setShowLeaderboard(true)
  const closeLeaderboard = () => setShowLeaderboard(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const blocks: { x: number; y: number; width: number; height: number; color: string }[] = []
    const blockSize = 50
    const blockGap = 10
    const chainLength = Math.floor(canvas.width / (blockSize + blockGap))

    // Light retro colors
    const retroColors = [
      '#FFB3BA', // Light Pink
      '#BAFFC9', // Light Mint
      '#BAE1FF', // Light Blue
      '#FFFFBA', // Light Yellow
      '#FFD9BA'  // Light Peach
    ]

    for (let i = 0; i < chainLength; i++) {
      blocks.push({
        x: i * (blockSize + blockGap),
        y: canvas.height + blockSize,
        width: blockSize,
        height: blockSize,
        color: retroColors[i % retroColors.length]
      })
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      blocks.forEach((block, index) => {
        if (block.y > canvas.height / 2 + Math.sin(index * 0.2) * 70) {
          block.y -= 1
        }

        ctx.fillStyle = block.color
        ctx.fillRect(block.x, block.y, block.width, block.height)

        if (index > 0) {
          ctx.beginPath()
          ctx.moveTo(blocks[index - 1].x + blockSize / 2, blocks[index - 1].y + blockSize / 2)
          ctx.lineTo(block.x + blockSize / 2, block.y + blockSize / 2)
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
          ctx.stroke()
        }
      })

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      // Recalculate block positions on resize
      const newChainLength = Math.floor(canvas.width / (blockSize + blockGap))
      blocks.length = 0
      for (let i = 0; i < newChainLength; i++) {
        blocks.push({
          x: i * (blockSize + blockGap),
          y: canvas.height + blockSize,
          width: blockSize,
          height: blockSize,
          color: retroColors[i % retroColors.length]
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div className="landing-container min-h-screen bg-white text-black relative overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-0"></canvas>
      <div className="relative z-10">
        <header className="landing-header flex justify-between items-center p-6 bg-white bg-opacity-90">
          <h1 className="logo text-4xl font-bold text-black">SocialTag</h1>
          <nav className="header-nav">
            <ul className="flex space-x-6">
              <li><button onClick={() => scrollToSection(featuresRef)} className="text-black hover:text-gray-600 transition-colors">Features</button></li>
              <li><button onClick={() => scrollToSection(aboutRef)} className="text-black hover:text-gray-600 transition-colors">About</button></li>
              <li><button onClick={() => scrollToSection(testimonialsRef)} className="text-black hover:text-gray-600 transition-colors">Testimonials</button></li>
            </ul>
          </nav>
          <div className="header-buttons flex space-x-4">
            <button 
              onClick={openLeaderboard} 
              className="nav-button bg-black text-white px-4 py-2 rounded-full hover:bg-opacity-90 transition-colors"
            >
              Leaderboard
            </button>
            <Link href="/dashboard" className="nav-button bg-black text-white px-4 py-2 rounded-full hover:bg-opacity-90 transition-colors">
              Dashboard
            </Link>
          </div>
        </header>
        <main className="landing-main">
          <div className="hero-content text-center mt-20 mb-12">
            <motion.h2 
              className="hero-title text-5xl font-bold mb-6 text-black"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Authentic You.<br />One Tag, Zero Imposters.
            </motion.h2>
            <motion.p 
              className="hero-subtitle text-xl mb-8 max-w-2xl mx-auto text-gray-600"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Step into a world where authenticity reigns. With Social Tag, your social media presence is protected by a single, blockchain-verified identity.
            </motion.p>
            <motion.button
              className="create-profile-button bg-black text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-opacity-90 transition-colors relative overflow-hidden mb-6"
              onClick={handleCreateProfileClick}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              Create Your Profile
            </motion.button>
            <div className="social-icons flex justify-center space-x-4">
              <Twitter size={24} className="text-black" />
              <Github size={24} className="text-black" />
              <SpotifyIcon size={24} className="text-black" />
              <Linkedin size={24} className="text-black" />
              <Facebook size={24} className="text-black" />
              <Instagram size={24} className="text-black" />
            </div>
          </div>
          <div className="scroll-indicator text-center mb-12">
            <p className="mb-2 text-gray-600">Scroll to learn more</p>
            <ChevronDown size={32} className="bounce mx-auto text-black" />
          </div>
          <section ref={featuresRef} className="features-section mb-20 px-4">
            <h2 className="section-title text-3xl font-bold text-center mb-12 text-black">Key Features</h2>
            <div className="feature-cards grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <motion.div 
                className="feature-card bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl text-left transition-all duration-300 shadow-lg border border-gray-200"
                whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
              >
                <FeatureIcon Icon={Shield} />
                <h3 className="text-xl font-semibold mb-2 text-black mt-6">Secure Identity</h3>
                <p className="text-gray-600">Safeguard your online presence with API authentication and blockchain verification, ensuring your identity is always authentic.</p>
              </motion.div>
              <motion.div 
                className="feature-card bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl text-left transition-all duration-300 shadow-lg border border-gray-200"
                whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
              >
                <FeatureIcon Icon={CheckCircle} />
                <h3 className="text-xl font-semibold mb-2 text-black mt-6">Effortless Verification</h3>
                <p className="text-gray-600">Easily tag all your social media accounts together and verify them in one simple process, no blockchain wallet or expertise required.</p>
              </motion.div>
              <motion.div 
                className="feature-card bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl text-left transition-all duration-300 shadow-lg border border-gray-200"
                whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
              >
                <FeatureIcon Icon={Lock} />
                <h3 className="text-xl font-semibold mb-2 text-black mt-6">Privacy Control</h3>
                <p className="text-gray-600">Take control of your data. Choose what information to share, verify or delete, with full transparency and control.</p>
              </motion.div>
            </div>
          </section>
          <section ref={aboutRef} className="about-section mb-20 px-4">
            <h2 className="section-title text-3xl font-bold text-center mb-12 text-black">About SocialTag</h2>
            <div className="about-content flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto">
              <div className="about-text md:w-1/2 mb-8 md:mb-0 md:pr-8">
                <p className="text-gray-600 mb-4">
                SocialTag was born from a vision of a more authentic online world. In an era where digital identity is increasingly important, we identified the need for a solution that allows users to prove they are the real person behind a specific social account. By linking multiple accounts, users can emphasize their authenticity across platforms. 
                </p>
                <p className="text-gray-600 mb-4">
                We aim to create a unique solution that ensures authenticity by leveraging the APIs of major social platforms, while optimizing for data integrity and transparency through the use of public blockchain technology.
                </p>
                <p className="text-gray-600">
                With SocialTag, we're not just verifying identities—we're creating a foundation for trusted online interactions. By empowering users to take control of their digital presence, we're paving the way for a more secure and authentic internet.
                </p>
              </div>
              <div className="about-image md:w-1/2">
                <Image 
                  src="/placeholder.svg?height=300&width=500" 
                  alt="About SocialTag" 
                  width={500} 
                  height={300} 
                  className="rounded-lg shadow-lg"
                />
              </div>
            </div>
          </section>
          <section ref={testimonialsRef} className="testimonials-section mb-20 px-4">
            <h2 className="section-title text-3xl font-bold text-center mb-12 text-black">What Our Users Say</h2>
            <div className="testimonials-grid grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <div className="testimonial bg-white p-6 rounded-lg shadow-lg">
                <p className="text-gray-600 mb-4">"SocialTag has revolutionized how I manage my online presence. It's simple, secure, and gives me peace of mind."</p>
                <p className="font-semibold">- Sarah J., Influencer</p>
              </div>
              <div className="testimonial bg-white p-6 rounded-lg shadow-lg">
                <p className="text-gray-600 mb-4">"As a business owner, verifying my identity across platforms is crucial. SocialTag makes it effortless."</p>
                <p className="font-semibold">- Michael R., Entrepreneur</p>
              </div>
            </div>
          </section>
        </main>
        <footer className="landing-footer text-center p-6 bg-black text-white">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">About Us</h3>
                <p className="text-sm">SocialTag: Authentic You. One Tag, Zero Imposters. Build on Algorand.</p>
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
            <h3 className="text-2xl font-bold mb-6 text-center">Login or Create Profile</h3>
            <button
              className="twitter-auth-button bg-blue-100 text-black w-full px-4 py-3 rounded-full flex items-center justify-center text-lg font-semibold hover:bg-opacity-90 transition-colors"
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