import React from 'react';
import { Cloud, RefreshCw } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Syncing with Database...", 
  className = '' 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center w-full min-h-[300px] p-8 ${className}`}>
      <div className="relative mb-6">
        {/* Pulse Effect */}
        <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
        
        {/* Icon Container */}
        <div className="relative bg-white p-4 rounded-full shadow-lg border border-blue-100 z-10">
          <Cloud className="w-10 h-10 text-blue-500" />
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
             <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
          </div>
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-800 animate-pulse">{message}</h3>
      <p className="text-sm text-gray-400 mt-2">Please wait while we retrieve your data.</p>
    </div>
  );
};