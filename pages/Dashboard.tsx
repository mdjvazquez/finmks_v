import React, { useMemo, useState, useEffect } from 'react';
import { useFinance } from '../context/FinancialContext';
import { TransactionType, AccountType } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, AlertCircle, Bell, Calendar, XCircle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { transactions, t } = useFinance();

  // Date Filter State - Defaults to Current Month
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
      start: '',
      end: ''
  });

  useEffect(() => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setDateRange({ start: startOfMonth, end: endOfMonth });
  }, []);

  const clearDateFilter = () => {
      setDateRange({ start: '', end: '' });
  };

  const filteredTransactions = useMemo(() => {
      if (!dateRange.start || !dateRange.end) return transactions;

      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999);

      return transactions.filter(t => {
          const tDate = new Date(t.date);
          return tDate >= start && tDate <= end;
      });
  }, [transactions, dateRange]);

  const metrics = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
    const receivables = filteredTransactions.filter(t => t.accountType === AccountType.RECEIVABLE).reduce((acc, t) => acc + t.amount, 0);
    const payables = filteredTransactions.filter(t => t.accountType === AccountType.PAYABLE).reduce((acc, t) => acc + t.amount, 0);

    return { income, expense, receivables, payables, balance: income - expense };
  }, [filteredTransactions]);

  const chartData = useMemo(() => {
    // Simple grouping by Group for pie chart
    const groups: any = {};
    filteredTransactions.forEach(t => {
        if (!groups[t.group]) groups[t.group] = 0;
        groups[t.group] += t.amount;
    });
    return Object.keys(groups).map(k => ({ name: k, value: groups[k] }));
  }, [filteredTransactions]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('financialOverview')}</h2>
          <p className="text-gray-500">{t('realTimeStatus')}</p>
        </div>
        
        {/* Date Filter UI */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
            <Calendar size={16} className="text-gray-500"/>
            <input 
                type="date" 
                value={dateRange.start}
                onChange={e => setDateRange(p => ({...p, start: e.target.value}))}
                className="text-sm outline-none text-black w-32 bg-white"
            />
            <span className="text-gray-400">-</span>
            <input 
                type="date" 
                value={dateRange.end}
                onChange={e => setDateRange(p => ({...p, end: e.target.value}))}
                className="text-sm outline-none text-black w-32 bg-white"
            />
            {(dateRange.start || dateRange.end) && (
                <button 
                    onClick={clearDateFilter}
                    title="Show All Time"
                    className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                    <XCircle size={16} />
                </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={t('netCashBalance')}
          value={`$${metrics.balance.toLocaleString()}`} 
          icon={Wallet} 
          color="bg-blue-500" 
        />
        <StatCard 
          title={t('totalIncome')} 
          value={`$${metrics.income.toLocaleString()}`} 
          icon={TrendingUp} 
          color="bg-green-500" 
        />
        <StatCard 
          title={t('totalExpenses')} 
          value={`$${metrics.expense.toLocaleString()}`} 
          icon={TrendingDown} 
          color="bg-red-500" 
        />
        <StatCard 
          title={t('pendingReceivables')} 
          value={`$${metrics.receivables.toLocaleString()}`} 
          icon={AlertCircle} 
          color="bg-orange-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">{t('activityDistribution')}</h3>
            {chartData.length > 0 ? (
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                    No data for selected period.
                </div>
            )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
         <h3 className="text-lg font-semibold mb-4">{t('recentTransactions')}</h3>
         <div className="overflow-y-auto h-64">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                    <tr>
                        <th className="px-4 py-2">{t('date')}</th>
                        <th className="px-4 py-2">{t('desc')}</th>
                        <th className="px-4 py-2 text-right">{t('amount')}</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTransactions.slice(0, 10).map(t => (
                        <tr key={t.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-700">{t.date}</td>
                            <td className="px-4 py-3 text-gray-900 truncate max-w-[150px]">{t.description}</td>
                            <td className={`px-4 py-3 text-right font-medium ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                                {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount}
                            </td>
                        </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                         <tr>
                            <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                                No recent transactions in this period.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
    <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
      <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h3 className="text-xl font-bold text-gray-900">{value}</h3>
    </div>
  </div>
);