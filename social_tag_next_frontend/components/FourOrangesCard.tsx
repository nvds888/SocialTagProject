import React from 'react'
import { Twitter, Facebook, Linkedin, Github } from 'lucide-react'
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

const FourOrangesCard: React.FC<ProfileCardProps> = ({
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
    event.preventDefault()
    event.stopPropagation()
    if (nfd && nfd.id) {
      window.open(`https://app.nf.domains/name/${nfd.name}`, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-[#1A1A1A] rounded-lg shadow-2xl overflow-hidden h-[600px] flex flex-col transform transition-all duration-300 hover:scale-105 relative">
      {/* Orange Accents */}
      <div className="absolute top-0 right-0 orange-accent"></div>
      <div className="absolute bottom-0 left-0 orange-accent rotate-180"></div>
      
      {/* Grouped Decorative Oranges */}
      <div className="absolute bottom-4 left-4 orange-group">
        <div className="orange-decoration">🍊</div>
        <div className="orange-decoration">🍊</div>
        <div className="orange-decoration">🍊</div>
        <div className="orange-decoration">🍊</div>
      </div>
      
      {/* Pattern Overlay */}
      <div className="absolute inset-0 z-0 opacity-5 carbon-pattern"></div>
      
      <CardContent className="p-6 flex flex-col h-full relative z-20">
        <div className="mb-4 flex items-center justify-between">
          {twitter && twitter.username && (
            <div className="flex items-center">
              <p className="text-gray-200 text-lg font-mono">@{twitter.username}</p>
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
                          <div className="bg-[#FF8C42] rounded-lg p-1 w-6 h-6 flex items-center justify-center">
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
                          className="ml-2 bg-[#2A2A2A] rounded-lg p-1 w-6 h-6 flex items-center justify-center border border-[#333333]"
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
                  <div className="flex items-center bg-[#2A2A2A] rounded-lg px-3 py-1 border border-[#333333]">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-2 text-[#FF8C42]">
                      <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 01-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004zM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 01-.921.42z" />
                      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.816a3.836 3.836 0 00-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 01-.921-.421l-.879-.66a.75.75 0 00-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 001.5 0v-.81a4.124 4.124 0 001.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 00-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 00.933-1.175l-.415-.33a3.836 3.836 0 00-1.719-.755V6z" clipRule="evenodd" />
                    </svg>
                    <span className="font-bold text-gray-200">{rewardPoints}</span>
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
            } border-2 border-[#333333] profile-container`}
            onClick={profileNFT ? handleNFTClick : undefined}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] rounded-full"></div>
            <div className="absolute inset-[2px] rounded-full overflow-hidden">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full h-full bg-[#2A2A2A]">
                      {profileNFT ? (
                        <img src={profileNFT.image} alt={profileNFT.name} className="w-full h-full object-cover" />
                      ) : profileImage ? (
                        <img src={profileImage} alt={username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200 text-4xl font-bold">
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
          {username && <h2 className="text-3xl font-bold text-gray-200 mb-2 font-mono">{username}</h2>}
          {jobTitle && <p className="text-xl text-gray-400 font-mono">{jobTitle}</p>}
        </div>

        <div className="mb-4">
          <h3 className="text-2xl font-semibold text-[#FF8C42] mb-2 font-mono">About me:</h3>
          <p className="text-gray-300 text-lg font-mono leading-relaxed">
            {bio ? truncateBio(bio, 25) : "No bio provided yet."}
          </p>
        </div>

        <div className="flex-grow"></div>

        {email && (
          <Button
            variant="outline"
            className="w-full text-lg mb-4 bg-[#2A2A2A] hover:bg-[#333333] text-gray-200 border border-[#333333] font-mono transition-all"
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
                      className={`text-gray-400 hover:text-[#FF8C42] transition-colors transform hover:scale-110 ${!data ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Icon size={36} />
                    </a>
                    {data && data[field as keyof typeof data] && (
                      <div className="absolute -top-1 -right-1 bg-[#2A2A2A] rounded-lg p-1 border border-[#FF8C42]">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-[#FF8C42]">
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
        .carbon-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L30 60M0 30L60 30M15 0L15 60M45 0L45 60M0 15L60 15M0 45L60 45' stroke='%23333' stroke-width='1'/%3E%3C/svg%3E");
          background-size: 20px 20px;
        }

        .orange-accent {
          width: 120px;
          height: 120px;
          background: radial-gradient(circle at center, transparent 30%, rgba(255, 140, 66, 0.2) 60%, transparent 70%);
          filter: blur(20px);
          transform: translate(50%, -50%);
          animation: pulse 3s ease-in-out infinite;
        }

        .orange-group {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 4px;
          width: fit-content;
          transform: rotate(-15deg);
          z-index: 30;
        }

        .orange-decoration {
          font-size: 32px;
          opacity: 0.4;
          filter: brightness(2);
          text-shadow: 0 0 10px rgba(255, 140, 66, 0.8);
          animation: floatOrange 6s ease-in-out infinite;
          animation-delay: var(--delay, 0s);
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.7;
          }
        }

        .profile-container::before {
          content: '';
          position: absolute;
          inset: -2px;
          background: linear-gradient(45deg, transparent, rgba(255, 140, 66, 0.2), transparent);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: xor;
          pointer-events: none;
          animation: borderRotate 4s linear infinite;
          border-radius: 50%;
        }

        @keyframes borderRotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes floatOrange {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            filter: brightness(2);
          }
          50% {
            transform: translate(2px, -2px) scale(1.1);
            filter: brightness(2.5);
          }
        }

        .orange-decoration:nth-child(1) {
          --delay: 0s;
          animation-duration: 4s;
        }

        .orange-decoration:nth-child(2) {
          --delay: 1s;
          animation-duration: 4.5s;
        }

        .orange-decoration:nth-child(3) {
          --delay: 2s;
          animation-duration: 5s;
        }

        .orange-decoration:nth-child(4) {
          --delay: 3s;
          animation-duration: 5.5s;
        }

        .shine-effect {
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            to right,
            transparent,
            rgba(255, 140, 66, 0.1),
            transparent
          );
          transform: skewX(-25deg);
          animation: shine 8s infinite;
        }

        @keyframes shine {
          0% {
            left: -100%;
          }
          20% {
            left: 200%;
          }
          100% {
            left: 200%;
          }
        }

        .profile-container {
          transition: transform 0.3s ease;
        }

        .profile-container:hover {
          transform: scale(1.05);
        }

        .profile-container:hover::before {
          animation: borderRotate 2s linear infinite;
        }

        button:hover {
          box-shadow: 0 0 15px rgba(255, 140, 66, 0.3);
        }

        .social-icon {
          transition: transform 0.3s ease, color 0.3s ease;
        }

        .social-icon:hover {
          transform: translateY(-2px) scale(1.1);
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #1A1A1A;
        }

        ::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #FF8C42;
        }

        /* Text selection */
        ::selection {
          background: rgba(255, 140, 66, 0.2);
          color: #FF8C42;
        }
      `}</style>
    </Card>
  )
}

export default FourOrangesCard