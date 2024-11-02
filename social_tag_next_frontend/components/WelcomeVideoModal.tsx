import React, { useState } from 'react';
import { X, Play } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface WelcomeVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeVideoModal: React.FC<WelcomeVideoModalProps> = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayClick = () => {
    setIsPlaying(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="sm:max-w-[1000px] md:max-w-[1200px] p-0 bg-black rounded-lg overflow-hidden">
        <DialogContent>
          <div className="relative w-full aspect-video">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all z-10"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            
            {!isPlaying && (
              <button
                onClick={handlePlayClick}
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 hover:bg-opacity-30 transition-all z-10"
              >
                <div className="w-20 h-20 flex items-center justify-center rounded-full bg-white bg-opacity-90 hover:bg-opacity-100 transition-transform hover:scale-110">
                  <Play size={40} className="text-black ml-2" />
                </div>
              </button>
            )}
            
            <video
              className="w-full h-full object-contain"
              controls={isPlaying}
              src="/WelcometoSocialTag.mp4"
              playsInline
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
};

export default WelcomeVideoModal;