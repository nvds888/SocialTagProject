import React from 'react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-grey-800 rounded-lg max-w-md w-full p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
          onClick={() => onOpenChange(false)}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

export const DialogContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
);

export const DialogHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mb-4">{children}</div>
);

export const DialogTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-xl font-semibold mb-2">{children}</h2>
);

export const DialogDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-gray-400">{children}</p>
);

export const DialogFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mt-6 flex justify-end space-x-2">{children}</div>
);
