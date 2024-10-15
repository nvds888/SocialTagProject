import React from 'react'
import { Twitter, Facebook, Linkedin, Github, Check } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import SpotifyIcon from '@/components/SpotifyIcon' 
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import AnimatedBorder from "@/components/ui/AnimatedBorder"

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
    { platform: 'twitter', icon: Twitter, data: twitter, field: 'username' },
    { platform: 'facebook', icon: Facebook, data: facebook, field: 'name' },
    { platform: 'linkedin', icon: Linkedin, data: linkedin, field: 'name' },
    { platform: 'github', icon: Github, data: github, field: 'username' },
    { platform: 'spotify', icon: SpotifyIcon, data: spotify, field: 'username' },
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
    <Card className="w-full max-w-md mx-auto bg-transparent backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden h-[600px] flex flex-col transform transition-all duration-300 hover:scale-105 relative">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/10 to-white/30 opacity-50"></div>
      <div className="absolute inset-0 z-10 bg-white/10 backdrop-blur-sm"></div>
      <CardContent className="p-6 flex flex-col h-full relative z-20">
        <div className="mb-4 flex items-center justify-between">
          {twitter && twitter.username && (
            <div className="flex items-center">
              <p className="text-white text-lg font-mono">@{twitter.username}</p>
              <div className="flex items-center ml-2">
                {isVerified && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={algorandTransactionId ? `https://testnet.explorer.perawallet.app/tx/${algorandTransactionId}` : '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center"
                        >
                          <div className="bg-yellow-400 rounded-full p-1 w-6 h-6 flex items-center justify-center">
                            <Check size={16} className="text-black" strokeWidth={3} />
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
          <AnimatedBorder className="w-32 h-32 mb-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className={`w-full h-full ${profileNFT ? 'cursor-pointer' : ''}`}
                    onClick={profileNFT ? handleNFTClick : undefined}
                  >
                    {profileNFT ? (
                      <img src={profileNFT.image} alt={profileNFT.name} className="w-full h-full object-cover" />
                    ) : profileImage ? (
                      <img src={profileImage} alt={username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
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
          </AnimatedBorder>
          {username && <h2 className="text-3xl font-bold text-white mb-2 font-serif">{username}</h2>}
          {jobTitle && <p className="text-xl text-gray-200 font-sans">{jobTitle}</p>}
        </div>

        <div className="mb-6">
          <h3 className="text-2xl font-semibold text-white mb-2 font-serif">About me:</h3>
          <p className="text-gray-200 text-lg font-sans leading-relaxed">
            {bio ? truncateBio(bio, 25) : "No bio provided yet."}
          </p>
        </div>
        {email && (
          <Button
            variant="outline"
            className="w-full text-lg mb-6 bg-white/20 hover:bg-white/30 text-white border-white/30 transition-colors duration-300"
          >
            {email}
          </Button>
        )}
        <div className="flex-grow"></div>
        <div className="flex justify-center space-x-6 mt-auto">
          <TooltipProvider>
            {socialIcons.map(({ platform, icon: Icon, data, field }) => (
              <Tooltip key={platform}>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <a
                      href={data ? `https://${platform}.com/${data[field as keyof typeof data]}` : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-white/70 hover:text-white transition-colors transform hover:scale-110 ${!data ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Icon size={36} />
                    </a>
                    {data && data[field as keyof typeof data] && (
                      <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                        <Check size={12} className="text-white" />
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
    </Card>
  )
}

export default ProfileCard