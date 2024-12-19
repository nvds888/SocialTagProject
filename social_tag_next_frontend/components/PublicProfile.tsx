'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Twitter, Facebook, Linkedin, Github } from 'lucide-react'
import axios from 'axios'

interface User {
  twitter?: { username: string };
  facebook?: { name: string };
  linkedin?: { name: string };
  github?: { username: string };
  theme?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const SocialIcon = ({ platform, username }: { platform: string; username: string }) => {
  const icons = {
    twitter: Twitter,
    facebook: Facebook,
    linkedin: Linkedin,
    github: Github,
  }
  const Icon = icons[platform as keyof typeof icons]
  return (
    <div className="flex items-center space-x-2">
      <Icon size={20} />
      <span>{username}</span>
    </div>
  )
}

const ThemeComponents = {
  SocialTag: ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg max-w-md w-full">
        {children}
      </div>
    </div>
  ),
  ArcticIce: ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-blue-100 text-blue-900 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="snowflake"
            style={{
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 3 + 2}s`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      <div className="bg-white bg-opacity-80 p-8 rounded-lg shadow-lg max-w-md w-full z-10">
        {children}
      </div>
    </div>
  ),
  TropicalIsland: ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-green-400 text-white flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="sun" />
        <div className="palm-tree left-10 bottom-0" />
        <div className="palm-tree right-10 bottom-0" />
      </div>
      <div className="bg-white bg-opacity-20 p-8 rounded-lg shadow-lg backdrop-blur-md max-w-md w-full z-10">
        {children}
      </div>
    </div>
  ),
}

export default function PublicProfile() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const username = params?.username as string

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/public-profile/${username}`)
        setUser(response.data)
        setError(null)
      } catch (err) {
        console.error('Error fetching user data:', err)
        setError('Failed to load user profile. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [username])

  if (loading) return <div className="loading text-center py-20">Loading...</div>
  if (error) return <div className="error text-red-500 text-center py-20">{error}</div>
  if (!user) return <div className="not-found text-center py-20">User not found</div>

  const ThemeComponent = ThemeComponents[user.theme as keyof typeof ThemeComponents] || ThemeComponents.SocialTag

  return (
    <ThemeComponent>
      <h1 className="text-3xl font-bold mb-6 text-center">Social Tag</h1>
      <div className="space-y-4">
        {user.twitter && <SocialIcon platform="twitter" username={user.twitter.username} />}
        {user.facebook && <SocialIcon platform="facebook" username={user.facebook.name} />}
        {user.linkedin && <SocialIcon platform="linkedin" username={user.linkedin.name} />}
        {user.github && <SocialIcon platform="github" username={user.github.username} />}
      </div>
    </ThemeComponent>
  )
}
