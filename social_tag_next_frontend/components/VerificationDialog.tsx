"use client";

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface VerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const VerificationDialog: React.FC<VerificationDialogProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-black text-2xl font-bold mb-4">Confirm Verification</h2>
            <p className="text-gray-700 mb-6">
              Are you sure that you would like to proceed with these authenticated social accounts? Be aware that Re-Verification will cost you 500 Reward Points and is only possible one time.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded bg-white text-black border border-black hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800 transition-colors"
              >
                Proceed
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default VerificationDialog