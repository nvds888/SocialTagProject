import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface NotificationMessageProps {
  show: boolean;
  onClose: () => void;
  message: string;
}

const NotificationMessage: React.FC<NotificationMessageProps> = ({ show, onClose, message }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 bg-white text-black p-4 rounded-lg shadow-lg max-w-sm"
        >
          <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
            <X size={16} />
          </button>
          <p>{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default NotificationMessage