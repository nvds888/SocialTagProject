import React from 'react'
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { ThemePurchaseService } from '@/services/ThemePurchaseService'

// Keep the original interface to maintain compatibility
interface PurchaseModalProps {
  themeName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPurchasing?: boolean;
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({ 
  themeName, 
  onConfirm, 
  onCancel,
  isPurchasing = false
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handlePayment = async (paymentType: 'USDC' | 'ORA') => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await ThemePurchaseService.purchaseTheme(themeName, paymentType);
      if (result.success) {
        onConfirm();
      } else {
        setError(result.message || 'Transaction failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An error occurred during the payment process');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold mb-4 text-black pr-8">Purchase Theme</h3>
        <p className="mb-6 text-gray-600">
          Select your preferred payment method to purchase {themeName}:
        </p>

        <div className="space-y-4">
          <Button
            variant="default"
            onClick={() => handlePayment('USDC')}
            disabled={isProcessing || isPurchasing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : (
              'Buy with USDC (1 USDC)'
            )}
          </Button>

          <Button
            variant="default"
            onClick={() => handlePayment('ORA')}
            disabled={isProcessing || isPurchasing}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white transition-colors"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : (
              'Buy with ORA (10 ORA)'
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

export default PurchaseModal