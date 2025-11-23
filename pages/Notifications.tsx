import React from 'react';
import { useFinance } from '../context/FinancialContext';
import { Bell, Check } from 'lucide-react';

export const Notifications: React.FC = () => {
  const { notifications, dismissNotification, t } = useFinance();

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">{t('pendingNotifications')}</h2>
        <p className="text-gray-500">Alerts for upcoming and overdue payments.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-[300px]">
         <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 border-b pb-4">
            <Bell className="text-gray-500" size={20} />
            {t('pendingNotifications')}
            {notifications.length > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {notifications.length}
                </span>
            )}
         </h3>
         <div className="overflow-y-auto flex-1 pr-2 space-y-3">
            {notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                    <Bell className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm">{t('noNotifications')}</p>
                </div>
            )}
            {notifications.map(n => (
                <div key={n.id} className={`p-4 rounded-lg border-l-4 shadow-sm transition-all flex justify-between items-start gap-4 ${n.severity === 'high' ? 'border-red-500 bg-red-50' : n.severity === 'medium' ? 'border-orange-500 bg-orange-50' : 'border-blue-500 bg-blue-50'}`}>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                             <p className={`text-base font-medium ${n.severity === 'high' ? 'text-red-800' : 'text-gray-800'}`}>
                                {n.message}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded uppercase font-bold ${n.severity === 'high' ? 'bg-red-200 text-red-800' : n.severity === 'medium' ? 'bg-orange-200 text-orange-800' : 'bg-blue-200 text-blue-800'}`}>
                                {n.type}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 font-mono bg-white bg-opacity-50 inline-block px-2 py-0.5 rounded">{t('due')}: {n.date}</p>
                    </div>
                    <button 
                        onClick={() => dismissNotification(n.id)}
                        title={t('markAsRead')}
                        className="p-2 bg-white rounded-full text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors shadow-sm"
                    >
                        <Check size={18} />
                    </button>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};