'use client'

import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Cookies from 'js-cookie'
import ProfileCard from '../../components/ProfileCard'
import FrostedGlassCard from '../../components/frosted-glass-card'
import HolographicCard from '../../components/holographic-card'
import SocialTagBackground from '../../components/SocialTagBackground'
import ArcticIceBackground from '../../components/ArcticIceBackground'
import TropicalIslandBackground from '../../components/TropicalIslandBackground'
import AlienLandscapeBackground from '../../components/AlienLandscapeBackground'
import BubbleTeaPartyBackground from '../../components/BubbleTeaPartyBackground'
import NeonCitySkyline from '../../components/NeonCitySkyline'
import SpaceOdysseyStargate from '../../components/SpaceOdysseyStargate'
import RetroWaveBackground from '../../components/RetroWaveBackground'
import ElectricPlasma from '../../components/ElectricPlasma'
import AbstractDataFlow from '../../components/AbstractDataFlow'
import PeraWalletBackground from '../../components/PeraWalletBackground'
import NFTicketBackground from '../../components/NFTicketBackground'
import SustainableCoffeeBackground from '../../components/SustainableCoffeeBackground'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Verification {
  id: string
  timestamp: string
  twitter?: string
  github?: string
  spotify?: string
  algorandTransactionId: string
  _id: string
}

interface PublicProfile {
  username: string
  jobTitle?: string
  bio?: string
  email?: string
  profileImage?: string
  profileNFT?: {
    id: string;
    name: string;
    image: string;
    url: string;
  };
  twitter?: { username: string }
  facebook?: { name: string }
  linkedin?: { name: string }
  github?: { username: string }
  spotify?: { username: string }
  dribbble?: { username: string }
  theme: string
  cardStyle: string
  verifications?: Verification[]
  algorandTransactionId?: string
  profileViews: number
  rewardPoints: number
  nfd?: {
    name: string;
    id: string;
  }
  isVerified: boolean
}

export default function PublicProfilePage() {
  const router = useRouter()
  const { username } = router.query
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewIncremented, setViewIncremented] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const url = `${API_BASE_URL}/api/public-profile/${username}`;
        console.log('Fetching profile from:', url);
        const response = await axios.get(url)
        const fetchedProfile = response.data

        // Check if the profile is verified
        if (!fetchedProfile.isVerified) {
          setError('This profile is not verified')
          setLoading(false)
          return
        }

        // Apply cached theme and card style
        if (fetchedProfile.twitter?.username) {
          const cachedTheme = localStorage.getItem(`theme_${fetchedProfile.twitter.username}`)
          const cachedCardStyle = localStorage.getItem(`cardStyle_${fetchedProfile.twitter.username}`)

          if (cachedTheme) {
            fetchedProfile.theme = cachedTheme
          }
          if (cachedCardStyle) {
            fetchedProfile.cardStyle = cachedCardStyle
          }
        }

        // Extract algorandTransactionId from the latest verification
        if (fetchedProfile.verifications && fetchedProfile.verifications.length > 0) {
          const latestVerification = fetchedProfile.verifications[fetchedProfile.verifications.length - 1]
          fetchedProfile.algorandTransactionId = latestVerification.algorandTransactionId
        }

        setProfile(fetchedProfile)
        console.log('Fetched profile:', fetchedProfile)
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    const incrementViewCount = async () => {
      if (typeof username === 'string' && !viewIncremented) {
        const cookieName = `viewed_${username}`;
        const viewedCookie = Cookies.get(cookieName);
        
        if (!viewedCookie) {
          try {
            console.log('Incrementing view count for:', username);
            const response = await axios.post(`${API_BASE_URL}/api/increment-view/${username}`);
            
            // Set cookie with 6-hour expiration
            Cookies.set(cookieName, 'true', { 
              expires: 0.25, // 0.25 days = 6 hours
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production'
            });
            
            setViewIncremented(true);
            
            // Update the profile with the new view count
            setProfile(prevProfile => {
              if (prevProfile) {
                return {
                  ...prevProfile,
                  profileViews: response.data.views,
                  rewardPoints: response.data.rewardPoints
                };
              }
              return prevProfile;
            });
            
            console.log('View count updated successfully:', response.data);
          } catch (error) {
            console.error('Error incrementing view count:', error);
          }
        } else {
          console.log('View already counted for this user within the cooldown period');
        }
      }
    };

    if (username) {
      fetchProfile()
      incrementViewCount()
    }
  }, [username, viewIncremented])

  const isProfileVerified = (profile: PublicProfile | null): boolean => {
    return !!profile?.algorandTransactionId
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-2xl font-bold">Loading...</div>
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-2xl font-bold text-red-500">{error}</div>
  if (!profile) return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-2xl font-bold">Profile not found</div>

  const BackgroundComponent = {
    SocialTag: SocialTagBackground,
    ArcticIce: ArcticIceBackground,
    TropicalIsland: TropicalIslandBackground,
    AlienLandscape: AlienLandscapeBackground,
    BubbleTeaParty: BubbleTeaPartyBackground,
    NeonCitySkyline: NeonCitySkyline,
    SpaceOdysseyStargate: SpaceOdysseyStargate,
    RetroWave: RetroWaveBackground,
    ElectricPlasma: ElectricPlasma,
    AbstractDataFlow: AbstractDataFlow,
    NFTicket: NFTicketBackground,
    SustainableCoffee: SustainableCoffeeBackground,
    PeraWallet: PeraWalletBackground
  }[profile.theme] || SocialTagBackground

  const isVerified = isProfileVerified(profile)

  const CardComponent = {
    Default: ProfileCard,
    'Frosted Glass': FrostedGlassCard,
    Holographic: HolographicCard
  }[profile.cardStyle] || ProfileCard

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      <BackgroundComponent />
      <div className="z-10 w-full max-w-md">
        <CardComponent
          username={profile.username}
          jobTitle={profile.jobTitle}
          bio={profile.bio}
          email={profile.email}
          profileImage={profile.profileNFT?.image || profile.profileImage}
          profileNFT={profile.profileNFT}
          twitter={profile.twitter}
          facebook={profile.facebook}
          linkedin={profile.linkedin}
          github={profile.github}
          spotify={profile.spotify}
          isVerified={isVerified}
          algorandTransactionId={profile.algorandTransactionId}
          profileViews={profile.profileViews}
          rewardPoints={profile.rewardPoints}
          nfd={profile.nfd}
        />
      </div>
    </div>
  )
}
