'use client'

import React, { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface SettingsPanelProps {
  user: {
    twitter?: { username: string };
  };
  onSettingsUpdate: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ user, onSettingsUpdate }) => {
  const [error, setError] = useState<string | null>(null)
  const [showDeletePopup, setShowDeletePopup] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const clearUserCache = () => {
    if (user.twitter?.username) {
      localStorage.removeItem(`purchasedItems_${user.twitter.username}`)
      localStorage.removeItem(`userSettings_${user.twitter.username}`)
      localStorage.removeItem(`theme_${user.twitter.username}`)
      localStorage.removeItem(`cardStyle_${user.twitter.username}`)
      localStorage.removeItem(`profileNFT_${user.twitter.username}`)
      localStorage.removeItem(`nfd_${user.twitter.username}`) // Remove NFD data
    }
    localStorage.removeItem('lastLoginDate')
    localStorage.removeItem('userPreferences')
    
    // Remove any other NFT and NFD-related items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('NFT_') || key.includes('profileNFT') || key.includes('nfd_'))) {
        localStorage.removeItem(key);
      }
    }
    
    sessionStorage.clear()
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    setError(null)
    try {
      await axios.delete(`${API_BASE_URL}/api/user`)
      clearUserCache()
      onSettingsUpdate() // Call onSettingsUpdate after successful deletion
      router.push('/')
    } catch (error) {
      console.error('Error deleting user data:', error)
      setError('Failed to delete user data. Please try again.')
    } finally {
      setIsDeleting(false)
      setShowDeletePopup(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 w-full max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-lg"
    >
      <h2 className="text-2xl font-bold mb-4 text-black">Settings</h2>
      
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          variant="outline"
          className="w-full mt-4 py-2 bg-white hover:bg-gray-100 text-black border border-black transition-colors duration-200"
          onClick={() => setShowDeletePopup(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Account
        </Button>
      </motion.div>

      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

      <AnimatePresence>
        {showDeletePopup && (
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
              className="bg-white p-6 rounded-lg max-w-sm w-full"
            >
              <h3 className="text-xl font-bold mb-4 text-black">Are you sure?</h3>
              <p className="mb-6 text-gray-700">This action cannot be undone. This will permanently delete your account and remove your data from our servers and your local device, including all purchased items, NFTs, and NFDs.</p>
              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDeletePopup(false)}
                  className="py-1 px-3 bg-white text-black border border-black hover:bg-gray-100 transition-colors duration-200"
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  className="py-1 px-3 bg-black text-white hover:bg-gray-800 transition-colors duration-200"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Yes, delete my account'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default SettingsPanel
