import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface WhiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

const WhiteDialog: React.FC<WhiteDialogProps> = ({ open, onOpenChange, title, children }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!bg-white !text-black !p-0 !m-0 !border-none !shadow-none sm:max-w-[700px]">
        <div className="!bg-white !text-black w-full h-full">
          <div className="p-6">
            <DialogHeader className="!p-0 !m-0">
              <DialogTitle className="text-2xl font-bold !text-black mb-4">{title}</DialogTitle>
              <Button
                className="absolute right-4 top-4 rounded-full p-2 !bg-gray-200 hover:!bg-gray-300 !text-black"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>
            <div className="!text-black">
              {children}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default WhiteDialog