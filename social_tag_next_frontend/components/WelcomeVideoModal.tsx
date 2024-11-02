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
      <div className="sm:max-w-[800px] p-0 bg-black rounded-lg overflow-hidden">
        <DialogContent>
          <div className="relative">
            <button
              onClick={onClose}
              className="absolute top-2 right-2 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all z-10"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <video
              className="w-full"
              controls
              autoPlay
              src="/WelcometoSocialTag.mp4"
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