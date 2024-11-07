'use client'

import React, { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Trash2, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

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
      localStorage.removeItem(`nfd_${user.twitter.username}`)
    }
    localStorage.removeItem('lastLoginDate')
    localStorage.removeItem('userPreferences')
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('NFT_') || key.includes('profileNFT') || key.includes('nfd_'))) {
        localStorage.removeItem(key);
      }
    }
    
    sessionStorage.clear()
  }

  const handleLogout = async () => {
    try {
      // Call logout endpoint to destroy session
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, { 
        withCredentials: true 
      });
      
      // Clear local storage cache
      clearUserCache();
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
      // Still redirect and clear cache even if logout fails
      clearUserCache();
      router.push('/');
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    setError(null)
    try {
      await axios.delete(`${API_BASE_URL}/api/user`)
      clearUserCache()
      onSettingsUpdate()
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
      className="w-full max-w-3xl mx-auto bg-white p-6 rounded-lg border-4 border-black"
    >
      <h2 className="text-2xl font-bold mb-4 text-black">Settings</h2>
      
      {/* Logout Button */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="mb-4"
      >
        <Button
          variant="outline"
          className="w-full py-2 bg-white text-black border-2 border-black rounded-lg hover:bg-gray-100 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0)] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </motion.div>

      {/* Delete Account Button */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          variant="outline"
          className="w-full py-2 bg-white text-black border-2 border-black rounded-lg hover:bg-gray-100 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0)] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
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
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-6 rounded-lg max-w-sm w-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0)]"
            >
              <h3 className="text-xl font-bold mb-4 text-black">Are you sure?</h3>
              <p className="mb-6 text-gray-700">This action cannot be undone. This will permanently delete your account and remove your data from our servers and your local device, including all purchased items, NFTs, and NFDs.</p>
              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDeletePopup(false)}
                  className="bg-white text-black px-4 py-2 rounded-lg border-2 border-black hover:bg-gray-100 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0)] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  className="bg-white text-black px-4 py-2 rounded-lg border-2 border-black hover:bg-gray-100 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0)] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
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
