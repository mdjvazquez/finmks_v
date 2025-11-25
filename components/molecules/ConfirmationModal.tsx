import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '../atoms/Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  details?: React.ReactNode;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  details,
  isLoading
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center">
        <div className="bg-blue-100 p-3 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-blue-600" />
        </div>
        
        <p className="text-gray-600 mb-6 text-sm">{message}</p>
        
        {details && (
           <div className="w-full bg-gray-50 p-4 rounded-lg mb-6 text-left text-sm border border-gray-100">
               {details}
           </div>
        )}

        <div className="flex w-full gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            {cancelText}
          </Button>
          <Button onClick={onConfirm} isLoading={isLoading} className="flex-1">
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
