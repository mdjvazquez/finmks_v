import React from 'react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';
import { Button } from '../atoms/Button';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  title?: string;
  message: string;
  closeText?: string;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  closeText = 'Close'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200 relative m-4">
        <button 
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1"
        >
            <X size={20} />
        </button>
        
        <div className="flex flex-col items-center text-center">
            <div className={`p-3 rounded-full mb-4 ${type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                {type === 'success' ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                )}
            </div>
            
            <h3 className={`text-lg font-bold mb-2 ${type === 'success' ? 'text-gray-900' : 'text-red-700'}`}>
                {title || (type === 'success' ? 'Success' : 'Error')}
            </h3>
            
            <p className="text-gray-500 mb-6 text-sm">
                {message}
            </p>
            
            <Button 
                onClick={onClose} 
                className="w-full"
                variant={type === 'success' ? 'success' : 'danger'}
            >
                {closeText}
            </Button>
        </div>
      </div>
    </div>
  );
};
