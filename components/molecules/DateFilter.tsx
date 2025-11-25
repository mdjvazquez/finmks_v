import React from 'react';
import { Calendar, XCircle } from 'lucide-react';

interface DateFilterProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  onClear: () => void;
  className?: string;
}

export const DateFilter: React.FC<DateFilterProps> = ({ 
  startDate, 
  endDate, 
  onChange, 
  onClear,
  className = '' 
}) => {
  return (
    <div className={`flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm ${className}`}>
        <Calendar size={16} className="text-gray-500"/>
        <input 
            type="date" 
            value={startDate}
            onChange={e => onChange(e.target.value, endDate)}
            className="text-sm outline-none text-black w-32 bg-white"
        />
        <span className="text-gray-400">-</span>
        <input 
            type="date" 
            value={endDate}
            onChange={e => onChange(startDate, e.target.value)}
            className="text-sm outline-none text-black w-32 bg-white"
        />
        {(startDate || endDate) && (
            <button 
                onClick={onClear}
                title="Clear Filter"
                className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
            >
                <XCircle size={16} />
            </button>
        )}
    </div>
  );
};