import React from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface WelcomeVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeVideoModal: React.FC<WelcomeVideoModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px] md:max-w-[1200px] p-0 bg-black rounded-lg overflow-hidden">
        <div className="relative w-full aspect-video">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <video
            className="w-full h-full object-contain"
            controls
            autoPlay
            muted={false}
            playsInline
            src="/WelcometoSocialTag.mp4"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeVideoModal;