import React, { useState, useRef } from 'react';
import { useFinance } from '../context/FinancialContext';
import { Transaction, ActivityGroup, TransactionType, AccountType, UserRole, TransactionStatus } from '../types';
import { analyzeReceiptImage } from '../services/geminiService';
import { Camera, Plus, Trash2, Loader2, CheckCircle, Clock, AlertTriangle, Calendar, XCircle, Calculator } from 'lucide-react';

export const Transactions: React.FC = () => {
  const { transactions, addTransaction, deleteTransaction, updateTransactionStatus, currentUser, companySettings, t } = useFinance();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'RECEIVABLE' | 'PAYABLE'>('ALL');
  
  // New State for tax calculation
  const [addTax, setAddTax] = useState(false);

  // Filters
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of month
      end: new Date().toISOString().split('T')[0] // Today
  });

  // Form State
  const [formData, setFormData] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    type: TransactionType.EXPENSE,
    group: ActivityGroup.OPERATING,
    accountType: AccountType.CASH,
    amount: 0,
    description: '',
    status: TransactionStatus.PAID
  });

  const canEdit = currentUser?.role !== UserRole.VIEWER;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1]; 
        
        try {
            const result = await analyzeReceiptImage(base64Data);
            setFormData(prev => ({
                ...prev,
                ...result,
                receiptImage: base64String
            }));
        } catch (error) {
            alert("Could not analyze image. Please fill manually.");
        } finally {
            setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;

    // Calculate tax if selected
    let finalAmount = Number(formData.amount);
    if (addTax) {
        finalAmount = finalAmount * (1 + companySettings.taxRate / 100);
    }

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      date: formData.date || new Date().toISOString().split('T')[0],
      dueDate: formData.dueDate,
      description: formData.description,
      amount: finalAmount,
      group: formData.group as ActivityGroup,
      type: formData.type as TransactionType,
      accountType: formData.accountType as AccountType,
      status: formData.status as TransactionStatus,
      receiptImage: formData.receiptImage
    };

    addTransaction(newTransaction);
    setFormData({
        date: new Date().toISOString().split('T')[0],
        type: TransactionType.EXPENSE,
        group: ActivityGroup.OPERATING,
        accountType: AccountType.CASH,
        amount: 0,
        description: '',
        receiptImage: undefined,
        status: TransactionStatus.PAID,
        dueDate: undefined
    });
    setAddTax(false); // Reset tax checkbox
  };

  const clearDateFilter = () => {
      setDateRange({ start: '', end: '' });
  };

  const filteredTransactions = transactions.filter(t => {
    // Filter by Tab
    if (activeTab !== 'ALL' && t.accountType !== activeTab) return false;
    
    // Filter by Date Range (Only if range is set)
    if (dateRange.start && dateRange.end) {
        const tDate = new Date(t.date);
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        end.setHours(23,59,59,999); // End of day
        
        if (tDate < start || tDate > end) return false;
    }
    
    return true;
  });

  const handleAccountTypeChange = (val: AccountType) => {
      let defaultStatus = TransactionStatus.PAID;
      if (val === AccountType.PAYABLE || val === AccountType.RECEIVABLE) {
          defaultStatus = TransactionStatus.PENDING;
      }
      setFormData({
          ...formData, 
          accountType: val, 
          status: defaultStatus
      });
  };

  const estimatedTotal = addTax ? (Number(formData.amount || 0) * (1 + companySettings.taxRate / 100)) : Number(formData.amount || 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col justify-between items-start mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('financialMovements')}</h2>
          <p className="text-gray-500">{t('manageMovements')}</p>
        </div>
        
        <div className="flex flex-col gap-4 w-full md:w-auto">
            {/* Date Filter */}
            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm w-full md:w-auto">
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
                        title="Clear Filter"
                        className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <XCircle size={16} />
                    </button>
                )}
            </div>

            {/* Tabs - Moved below dates */}
            <div className="flex bg-gray-200 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
                {['ALL', 'RECEIVABLE', 'PAYABLE'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap flex-1 ${
                            activeTab === tab 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        {tab === 'ALL' ? t('allMovements') : tab === 'RECEIVABLE' ? t('accountsReceivable') : t('accountsPayable')}
                    </button>
                ))}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="xl:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-4">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Plus size={20} className="text-blue-500"/> {t('recordMovement')}
                </h3>
                
                {/* AI Upload */}
                <div className="mb-6 p-4 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50 text-center">
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange}
                    />
                    {isAnalyzing ? (
                        <div className="flex flex-col items-center text-blue-600">
                            <Loader2 className="animate-spin mb-2" />
                            <span className="text-sm font-medium">{t('analyzing')}</span>
                        </div>
                    ) : (
                        <button 
                            type="button"
                            disabled={!canEdit}
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center w-full text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                        >
                            <Camera className="w-8 h-8 mb-2" />
                            <span className="text-sm font-semibold">{t('scanReceipt')}</span>
                            <span className="text-xs text-blue-400 mt-1">{t('autoDetect')}</span>
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">{t('description')}</label>
                        <input 
                            type="text" 
                            disabled={!canEdit}
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black"
                            placeholder={t('invoicePlaceholder')}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">{t('amount')}</label>
                            <input 
                                type="number" 
                                disabled={!canEdit}
                                value={formData.amount}
                                onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">{t('movementDate')}</label>
                            <input 
                                type="date" 
                                disabled={!canEdit}
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black"
                            />
                        </div>
                    </div>

                    {/* Tax Option */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                             <input 
                                type="checkbox"
                                checked={addTax}
                                onChange={e => setAddTax(e.target.checked)}
                                disabled={!canEdit}
                                className="rounded text-blue-600 focus:ring-blue-500 bg-white"
                             />
                             <span className="text-sm text-gray-700 font-medium">{t('addTax')} ({companySettings.taxRate}%)</span>
                        </label>
                        <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-200">
                            <span>{t('finalAmount')}:</span>
                            <span className="font-bold text-gray-900 text-sm">${estimatedTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-xs font-medium text-gray-700 mb-1">{t('accountType')}</label>
                            <select 
                                disabled={!canEdit}
                                value={formData.accountType}
                                onChange={e => handleAccountTypeChange(e.target.value as AccountType)}
                                className="w-full p-2 border rounded-lg bg-white text-black"
                            >
                                {Object.values(AccountType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">{t('flowType')}</label>
                            <select 
                                disabled={!canEdit}
                                value={formData.type}
                                onChange={e => setFormData({...formData, type: e.target.value as TransactionType})}
                                className="w-full p-2 border rounded-lg bg-white text-black"
                            >
                                {Object.values(TransactionType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Conditional Fields for AR/AP */}
                    {(formData.accountType === AccountType.PAYABLE || formData.accountType === AccountType.RECEIVABLE) && (
                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                            <h4 className="text-xs font-bold text-yellow-800 mb-2 uppercase tracking-wide">{t('paymentDetails')}</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">{t('dueDate')}</label>
                                    <input 
                                        type="date" 
                                        disabled={!canEdit}
                                        value={formData.dueDate || ''}
                                        onChange={e => setFormData({...formData, dueDate: e.target.value})}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none bg-white text-black"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">{t('status')}</label>
                                    <select 
                                        disabled={!canEdit}
                                        value={formData.status}
                                        onChange={e => setFormData({...formData, status: e.target.value as TransactionStatus})}
                                        className="w-full p-2 border rounded-lg bg-white text-black"
                                    >
                                        {Object.values(TransactionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">{t('activityGroup')}</label>
                        <select 
                            disabled={!canEdit}
                            value={formData.group}
                            onChange={e => setFormData({...formData, group: e.target.value as ActivityGroup})}
                            className="w-full p-2 border rounded-lg bg-white text-black"
                        >
                            {Object.values(ActivityGroup).map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>

                    <button 
                        type="submit"
                        disabled={!canEdit}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                    >
                        {t('saveMovement')}
                    </button>
                </form>
            </div>
        </div>

        {/* List Section */}
        <div className="xl:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3 text-left">{t('description')}</th>
                                <th className="px-6 py-3 text-left">{t('details')}</th>
                                <th className="px-6 py-3 text-left">{t('status')}</th>
                                <th className="px-6 py-3 text-right">{t('amount')}</th>
                                <th className="px-6 py-3 text-center">{t('action')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTransactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{tx.description}</div>
                                        <div className="text-xs text-gray-500">{tx.date}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="inline-flex w-fit px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                                {tx.accountType}
                                            </span>
                                            <span className="inline-flex w-fit px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700">
                                                {tx.group}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {tx.status === TransactionStatus.PAID ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <CheckCircle size={12} /> {t('paid')}
                                            </span>
                                        ) : (
                                            <div className="flex flex-col gap-1">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    <Clock size={12} /> {t('pending')}
                                                </span>
                                                {tx.dueDate && (
                                                    <span className="text-xs text-red-500 flex items-center gap-1">
                                                        <AlertTriangle size={10} /> {t('due')}: {tx.dueDate}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className={`px-6 py-4 text-right font-bold ${tx.type === TransactionType.INCOME ? 'text-green-600' : 'text-gray-900'}`}>
                                        {tx.type === TransactionType.INCOME ? '+' : '-'}${tx.amount.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {canEdit && tx.status === TransactionStatus.PENDING && (
                                                <button 
                                                    onClick={() => updateTransactionStatus(tx.id, TransactionStatus.PAID)}
                                                    title="Mark as Paid"
                                                    className="p-1 text-green-500 hover:bg-green-50 rounded"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                            {canEdit && (
                                                <button 
                                                    onClick={() => deleteTransaction(tx.id)}
                                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                        {t('noTransactions')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};