import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { X } from 'lucide-react'

interface NFD {
  id: string;
  name: string;
}

interface NFDSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  nfds: NFD[];
  selectedNFD: NFD | null;
  onSelectNFD: (nfd: NFD) => void;
  isLoading: boolean;
}

const NFDSelectionModal: React.FC<NFDSelectionModalProps> = ({
  isOpen,
  onClose,
  nfds,
  selectedNFD,
  onSelectNFD,
  isLoading
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white p-6 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-black">Select NFD</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {isLoading ? (
              <p className="text-center text-gray-500">Loading NFDs...</p>
            ) : nfds.length === 0 ? (
              <p className="text-center text-gray-500">No NFDs found in your wallet.</p>
            ) : (
              <div className="space-y-2">
                {nfds.map((nfd) => (
                  <Button
                    key={nfd.id}
                    variant="outline"
                    className={`w-full justify-start ${
                      selectedNFD?.id === nfd.id ? 'bg-black text-white' : 'bg-white text-black'
                    }`}
                    onClick={() => onSelectNFD(nfd)}
                  >
                    {nfd.name}
                  </Button>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default NFDSelectionModal