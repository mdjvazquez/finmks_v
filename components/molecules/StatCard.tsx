import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '../atoms/Card';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => {
  // Extract text color class from bg class for icon
  const textColor = color.replace('bg-', 'text-');
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${textColor}`} />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <h3 className="text-xl font-bold text-gray-900">{value}</h3>
      </div>
    </div>
  );
};