import React from 'react'
import { Button } from "@/components/ui/button"

interface PurchaseModalProps {
  themeName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({ themeName, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-sm w-full">
        <h3 className="text-xl font-bold mb-4 text-white">Purchase Theme</h3>
        <p className="mb-6 text-gray-300">
          You can buy the {themeName} theme for 1 USD. Would you like to purchase?
        </p>
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className="py-1 px-3 bg-gray-700 text-white hover:bg-gray-600"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={onConfirm}
            className="py-1 px-3 bg-blue-600 text-white hover:bg-blue-700"
          >
            Yes, purchase
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PurchaseModal