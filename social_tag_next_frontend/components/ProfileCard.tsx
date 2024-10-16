import React from 'react'
import { Twitter, Facebook, Linkedin, Github, ExternalLink } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import SpotifyIcon from '@/components/SpotifyIcon' 
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ProfileCardProps {
  username?: string
  jobTitle?: string
  bio?: string
  email?: string
  profileImage?: string
  profileNFT?: {
    id: string;
    name: string;
    image: string;
    url: string;
  }
  twitter?: { username: string }
  facebook?: { name: string }
  linkedin?: { name: string }
  github?: { username: string }
  spotify?: { username: string }
  algorandTransactionId?: string
  isVerified: boolean
  rewardPoints: number
  nfd?: {
    name: string;
    id: string;
  }
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  username,
  jobTitle,
  bio,
  email,
  profileImage,
  profileNFT,
  twitter,
  facebook,
  linkedin,
  github,
  spotify,
  algorandTransactionId,
  isVerified,
  rewardPoints,
  nfd,
}) => {
  const socialIcons = [
    { platform: 'twitter', icon: Twitter, data: twitter, field: 'username', url: (username: string) => `https://twitter.com/${username}` },
    { platform: 'facebook', icon: Facebook, data: facebook, field: 'name', url: (name: string) => `https://facebook.com/${name}` },
    { platform: 'linkedin', icon: Linkedin, data: linkedin, field: 'name', url: (name: string) => `https://linkedin.com/in/${name}` },
    { platform: 'github', icon: Github, data: github, field: 'username', url: (username: string) => `https://github.com/${username}` },
    { platform: 'spotify', icon: SpotifyIcon, data: spotify, field: 'username', url: (username: string) => `https://open.spotify.com/user/${username}` },
  ]

  const truncateBio = (text: string | undefined, wordLimit: number) => {
    if (!text) return ''
    const words = text.split(' ')
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(' ') + '...'
    }
    return text
  }

  const handleNFTClick = () => {
    if (profileNFT && profileNFT.id) {
      window.open(`https://explorer.perawallet.app/asset/${profileNFT.id}`, '_blank', 'noopener,noreferrer')
    }
  }

  const handleNFDClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log("NFD Click triggered");
    console.log("NFD data:", nfd);
    if (nfd && nfd.id) {
      const url = `https://explorer.perawallet.app/asset/${nfd.id}`;
      console.log("Opening URL:", url);
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      console.log("NFD id is missing");
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-black rounded-3xl shadow-2xl overflow-hidden h-[600px] flex flex-col transform transition-all duration-300 hover:scale-105 hover:rotate-1 relative">
      <div className="absolute inset-0 z-0 bg-graph-texture opacity-10"></div>
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 opacity-80"></div>
      <div className="absolute inset-0 z-20 transition-opacity duration-300 opacity-0 hover:opacity-100 shimmer-effect"></div>
      <CardContent className="p-6 flex flex-col h-full relative z-30">
        <div className="mb-4 flex items-center justify-between">
          {twitter && twitter.username && (
            <div className="flex items-center">
              <p className="text-gray-400 text-lg font-bold font-mono">@{twitter.username}</p>
              <div className="flex items-center ml-2">
                {isVerified && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={algorandTransactionId ? `https://explorer.perawallet.app/tx/${algorandTransactionId}` : '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center"
                        >
                          <div className="bg-yellow-400 rounded-full p-1 w-6 h-6 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-black">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                        </a>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{algorandTransactionId ? "Verified - Click to view transaction" : "Verified"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {nfd && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button 
                          onClick={handleNFDClick} 
                          className="ml-2 bg-orange-600 rounded-full p-1 w-6 h-6 flex items-center justify-center"
                        >
                          <img src="https://pbs.twimg.com/profile_images/1517337727066427399/EvCOXfoQ_400x400.png" alt="NFD" className="w-4.5 h-4.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>NFD: {nfd.name} - Click to view</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center bg-yellow-400 rounded-full px-2 py-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1 text-black">
                      <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 01-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004zM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 01-.921.42z" />
                      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.816a3.836 3.836 0 00-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 01-.921-.421l-.879-.66a.75.75 0 00-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 001.5 0v-.81a4.124 4.124 0 001.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 00-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 00.933-1.175l-.415-.33a3.836 3.836 0 00-1.719-.755V6z" clipRule="evenodd" />
                    </svg>
                    <span className="font-bold text-black">{rewardPoints}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Reward Points</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div 
            className={`w-32 h-32 rounded-full overflow-hidden mb-4 relative ${
              profileNFT ? 'cursor-pointer' : ''
            } shadow-lg`}
            onClick={profileNFT ? handleNFTClick : undefined}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-gradient-x"></div>
            <div className="absolute inset-[2px] rounded-full overflow-hidden">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full h-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                      {profileNFT ? (
                        <img src={profileNFT.image} alt={profileNFT.name} className="w-full h-full object-cover" />
                      ) : profileImage ? (
                        <img src={profileImage} alt={username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                          {username ? username.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {profileNFT ? <p>NFT: {profileNFT.name} - Click to view</p> : <p>Profile Image</p>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          {username && <h2 className="text-3xl font-bold text-white mb-2 font-serif">{username}</h2>}
          {jobTitle && <p className="text-xl text-gray-300 font-sans">{jobTitle}</p>}
        </div>
        <div className="mb-6 flex-grow">
          <h3 className="text-2xl font-semibold text-white mb-2 font-serif">About me:</h3>
          <p className="text-gray-300 text-lg font-sans leading-relaxed">
            {bio ? truncateBio(bio, 25) : "No bio provided yet."}
          </p>
        </div>
        {email && (
          <Button
            variant="outline"
            className="w-full text-lg mb-6 bg-gray-800 hover:bg-gray-700 text-white border-gray-600 transition-colors duration-300"
          >
            {email}
          </Button>
        )}
        <div className="flex justify-center space-x-6 mt-auto">
          <TooltipProvider>
            {socialIcons.map(({ platform, icon: Icon, data, field, url }) => (
              <Tooltip key={platform}>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <a
                      href={data ? url(data[field as keyof typeof data] as string) : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-gray-300 hover:text-white transition-colors transform hover:scale-110 ${!data ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Icon size={36} />
                    </a>
                    {data && data[field as keyof typeof data] && (
                      <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-white">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{data && data[field as keyof typeof data] ? data[field as keyof typeof data] : `${platform} not verified`}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>

        <div className="h-12"></div>
      </CardContent>
      <style jsx>{`
        .bg-graph-texture {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .shimmer-effect {
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255,0) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        @keyframes shimmer {
          0%{
            background-position: 100% 0;
          }
          100% {
            background-position: -100% 0;
          }
        }
        .card {
          animation: tilt 10s infinite linear;
        }
        @keyframes tilt {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(1deg);
          }
          75% {
            transform: rotate(-1deg);
          }
        }
      `}</style>
    </Card>
  )
}

export default ProfileCard