
import React, { useMemo, useState, useEffect } from 'react';
import { useFinance } from '../context/FinancialContext';
import { TransactionType, AccountType, ActivityGroup } from '../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react';
import { StatCard } from '../components/molecules/StatCard';
import { Card } from '../components/atoms/Card';
import { LoadingState } from '../components/atoms/LoadingState';
import { DateFilter } from '../components/molecules/DateFilter';

export const Dashboard: React.FC = () => {
  const { transactions, isLoading, t } = useFinance();

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

  const handleDateChange = (start: string, end: string) => {
      setDateRange({ start, end });
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

  const incomeChartData = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredTransactions
        .filter(t => t.type === TransactionType.INCOME)
        .forEach(t => {
            if (!groups[t.group]) groups[t.group] = 0;
            groups[t.group] += t.amount;
        });
    return Object.keys(groups).map(k => ({ name: k, value: groups[k] }));
  }, [filteredTransactions]);

  const expenseChartData = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .forEach(t => {
            if (!groups[t.group]) groups[t.group] = 0;
            groups[t.group] += t.amount;
        });
    return Object.keys(groups).map(k => ({ name: k, value: groups[k] }));
  }, [filteredTransactions]);

  // Specific Colors for Activity Groups
  const GROUP_COLORS: Record<string, string> = {
      [ActivityGroup.OPERATING]: '#3B82F6', // Blue-500
      [ActivityGroup.INVESTING]: '#8B5CF6', // Violet-500
      [ActivityGroup.FINANCING]: '#F97316', // Orange-500
  };

  const getGroupColor = (groupName: string) => GROUP_COLORS[groupName] || '#9CA3AF'; // Default gray

  if (isLoading) {
      return <LoadingState message={t('loadingAI')} />;
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('financialOverview')}</h2>
          <p className="text-gray-500">{t('realTimeStatus')}</p>
        </div>
        
        <DateFilter 
            startDate={dateRange.start} 
            endDate={dateRange.end} 
            onChange={handleDateChange} 
            onClear={clearDateFilter} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('netCashBalance')} value={`$${metrics.balance.toLocaleString()}`} icon={Wallet} color="bg-blue-500" />
        <StatCard title={t('totalIncome')} value={`$${metrics.income.toLocaleString()}`} icon={TrendingUp} color="bg-green-500" />
        <StatCard title={t('totalExpenses')} value={`$${metrics.expense.toLocaleString()}`} icon={TrendingDown} color="bg-red-500" />
        <StatCard title={t('pendingReceivables')} value={`$${metrics.receivables.toLocaleString()}`} icon={AlertCircle} color="bg-orange-500" />
      </div>

      {/* Legend Section - Molecule */}
      <div className="flex flex-wrap justify-center gap-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          {[ActivityGroup.OPERATING, ActivityGroup.INVESTING, ActivityGroup.FINANCING].map(group => (
            <div key={group} className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: GROUP_COLORS[group] }}></span>
              <span className="text-sm font-medium text-gray-700">{t(`val_${group}`)}</span>
            </div>
          ))}
      </div>

      {/* Pie Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card title={t('incomeDistribution')}>
            {incomeChartData.length > 0 ? (
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={incomeChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {incomeChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={getGroupColor(entry.name)} />)}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, t(`val_${name}`)]} 
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ) : <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No income data.</div>}
        </Card>

        <Card title={t('expenseDistribution')}>
             {expenseChartData.length > 0 ? (
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={expenseChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {expenseChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={getGroupColor(entry.name)} />)}
                            </Pie>
                             <Tooltip 
                              formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, t(`val_${name}`)]} 
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ) : <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No expense data.</div>}
        </Card>
      </div>

      <Card title={t('recentTransactions')}>
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
                         <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No recent transactions.</td></tr>
                    )}
                </tbody>
            </table>
         </div>
      </Card>
    </div>
  );
};
