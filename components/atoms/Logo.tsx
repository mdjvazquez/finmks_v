
import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = 'w-10 h-10 text-blue-600' }) => {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M6 20V4C6 3.44772 6.44772 3 7 3H9C9.55228 3 10 3.44772 10 4V20C10 20.5523 9.55228 21 9 21H7C6.44772 21 6 20.5523 6 20Z" 
        fill="currentColor"
      />
      <path 
        d="M14 12V4C14 3.44772 14.4477 3 15 3H17C17.5523 3 18 3.44772 18 4V12C18 12.5523 17.5523 13 17 13H15C14.4477 13 14 12.5523 14 12Z" 
        fill="currentColor" 
        opacity="0.8"
      />
      <path 
        d="M6 14L18 6" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round"
      />
    </svg>
  );
};
