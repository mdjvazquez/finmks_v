import React, { useState } from 'react';
import { useFinance } from '../context/FinancialContext';
import { ReportType, FinancialReport, Transaction, TransactionType } from '../types';
import { FileText, Sparkles, Printer, Download, Calendar, BrainCircuit, Eye, AlertCircle } from 'lucide-react';

export const Reports: React.FC = () => {
  const { reports, generateReport, analyzeReport, isLoading, t } = useFinance();
  const [selectedReport, setSelectedReport] = useState<FinancialReport | null>(null);
  
  // Date Selection for Generation
  const [generationRange, setGenerationRange] = useState<{start: string, end: string}>({
      start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Jan 1st
      end: new Date().toISOString().split('T')[0]
  });

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, type?: ReportType}>({ isOpen: false });

  const initiateGeneration = (type: ReportType) => {
      setConfirmModal({ isOpen: true, type });
  };

  const confirmGeneration = () => {
      if (confirmModal.type) {
          generateReport(confirmModal.type, generationRange.start, generationRange.end);
      }
      setConfirmModal({ isOpen: false, type: undefined });
  };

  const handleDownloadPDF = () => {
    if (!selectedReport) return;
    
    const element = document.getElementById('report-content');
    if (!element) return;

    const opt = {
      margin: 10,
      filename: `${selectedReport.folio}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // @ts-ignore
    if (window.html2pdf) {
        // @ts-ignore
        window.html2pdf().set(opt).from(element).save();
    } else {
        window.print();
    }
  };

  const renderTransactionList = (title: string, transactions: any[], showDueDate: boolean = false) => (
      <div className="mt-6 mb-4 break-inside-avoid">
          <h5 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-2 border-b border-gray-300 pb-1">{title}</h5>
          <table className="w-full text-xs font-mono">
              <thead>
                  <tr className="text-gray-600 text-left">
                      <th className="pb-1">{t('date')}</th>
                      <th className="pb-1">{t('description')}</th>
                      {showDueDate && <th className="pb-1">{t('dueDate')}</th>}
                      <th className="pb-1 text-right">{t('amount')}</th>
                  </tr>
              </thead>
              <tbody>
                  {transactions.map((tx, i) => (
                      <tr key={i} className="border-b border-gray-100">
                          <td className="py-1 text-gray-700">{tx.date}</td>
                          <td className="py-1 text-black">{tx.description || tx.desc}</td>
                          {showDueDate && <td className="py-1 text-red-600">{tx.dueDate}</td>}
                          <td className="py-1 text-right text-black">
                             {tx.type === TransactionType.EXPENSE ? '-' : ''}${tx.amount.toFixed(2)}
                          </td>
                      </tr>
                  ))}
                  {transactions.length === 0 && (
                      <tr><td colSpan={4} className="py-2 text-gray-400 italic">No transactions.</td></tr>
                  )}
              </tbody>
          </table>
      </div>
  );

  // Render specific table based on report type with TRANSLATIONS
  const renderReportData = (report: FinancialReport) => {
      if (report.type === ReportType.INCOME_STATEMENT) {
          const { revenues, expenses, totalRevenue, totalExpenses, netIncome, incomeBeforeTax, taxAmount, taxRate } = report.data;
          return (
              <div className="space-y-4 font-mono text-sm text-black">
                  <div>
                      <h4 className="font-bold text-gray-900 border-b border-gray-400 mb-2">{t('r_revenues')}</h4>
                      <div className="flex justify-between font-bold pt-2 border-t border-gray-200 mt-2 bg-gray-50 p-2">
                          <span>{t('r_total_revenue')}</span>
                          <span>${totalRevenue.toFixed(2)}</span>
                      </div>
                  </div>
                  <div>
                      <h4 className="font-bold text-gray-900 border-b border-gray-400 mb-2 mt-6">{t('r_expenses')}</h4>
                      <div className="flex justify-between font-bold pt-2 border-t border-gray-200 mt-2 bg-gray-50 p-2">
                          <span>{t('r_total_expenses')}</span>
                          <span>${totalExpenses.toFixed(2)}</span>
                      </div>
                  </div>

                  <div className="mt-6 border-t-2 border-gray-900 pt-4">
                        <div className="flex justify-between font-bold">
                            <span>{t('r_income_before_tax')}</span>
                            <span>${incomeBeforeTax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-1 text-gray-700">
                            <span>{t('r_tax_provision')} ({taxRate}%)</span>
                            <span>(${taxAmount.toFixed(2)})</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300 mt-2">
                            <span>{t('r_net_income')}</span>
                            <span className={netIncome >= 0 ? 'text-green-700' : 'text-red-700'}>${netIncome.toFixed(2)}</span>
                        </div>
                  </div>

                  <div className="mt-10 pt-4 border-t border-dashed border-gray-300">
                      <h4 className="font-bold text-lg text-gray-800 mb-4">{t('transactionBreakdown')}</h4>
                      {renderTransactionList(t('r_revenues'), revenues)}
                      {renderTransactionList(t('r_expenses'), expenses)}
                  </div>
              </div>
          );
      } else if (report.type === ReportType.BALANCE_SHEET) {
          const { assets, liabilities, equity, details } = report.data;
          return (
              <div className="space-y-6 font-mono text-sm text-black">
                  <div>
                      <h4 className="font-bold text-gray-900 border-b border-gray-400 mb-2">{t('r_assets')}</h4>
                      <div className="flex justify-between py-1"><span>{t('r_cash_equivalents')}</span><span>${assets.cashAndEquivalents.toFixed(2)}</span></div>
                      <div className="flex justify-between py-1"><span>{t('r_accounts_receivable')}</span><span>${assets.accountsReceivable.toFixed(2)}</span></div>
                      <div className="flex justify-between py-1"><span>{t('r_fixed_assets')}</span><span>${assets.fixedAssets.toFixed(2)}</span></div>
                      <div className="flex justify-between font-bold pt-2 border-t border-gray-200 mt-2 bg-gray-50 p-2">
                          <span>{t('r_total_assets')}</span>
                          <span>${assets.totalAssets.toFixed(2)}</span>
                      </div>
                  </div>
                  <div>
                      <h4 className="font-bold text-gray-900 border-b border-gray-400 mb-2">{t('r_liabilities')}</h4>
                      <div className="flex justify-between py-1"><span>{t('r_accounts_payable')}</span><span>${liabilities.accountsPayable.toFixed(2)}</span></div>
                      <div className="flex justify-between py-1"><span>{t('r_long_term_debt')}</span><span>${liabilities.longTermDebt.toFixed(2)}</span></div>
                      <div className="flex justify-between font-bold pt-2 border-t border-gray-200 mt-2 bg-gray-50 p-2">
                          <span>{t('r_total_liabilities')}</span>
                          <span>${liabilities.totalLiabilities.toFixed(2)}</span>
                      </div>
                  </div>
                  <div>
                      <h4 className="font-bold text-gray-900 border-b border-gray-400 mb-2">{t('r_equity')}</h4>
                      <div className="flex justify-between font-bold pt-2 bg-gray-50 p-2">
                          <span>{t('r_total_equity')}</span>
                          <span>${equity.toFixed(2)}</span>
                      </div>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-4 border-t-2 border-black mt-2">
                      <span>{t('r_total_liab_equity')}</span>
                      <span>${(liabilities.totalLiabilities + equity).toFixed(2)}</span>
                  </div>

                   <div className="mt-10 pt-4 border-t border-dashed border-gray-300">
                      <h4 className="font-bold text-lg text-gray-800 mb-4">{t('transactionBreakdown')}</h4>
                      {renderTransactionList(t('r_accounts_receivable'), details?.pendingReceivables || [], true)}
                      {renderTransactionList(t('r_accounts_payable'), details?.pendingPayables || [], true)}
                  </div>
              </div>
          );
      } else if (report.type === ReportType.CASH_FLOW) {
           const { operatingActivities, investingActivities, financingActivities, netCashFlow, details } = report.data;
           return (
               <div className="space-y-4 font-mono text-sm text-black">
                   <div className="flex justify-between py-2 border-b border-gray-200">
                       <span>{t('r_op_activities')}</span>
                       <span className={operatingActivities >= 0 ? 'text-green-700' : 'text-red-700'}>${operatingActivities.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between py-2 border-b border-gray-200">
                       <span>{t('r_inv_activities')}</span>
                       <span className={investingActivities >= 0 ? 'text-green-700' : 'text-red-700'}>${investingActivities.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between py-2 border-b border-gray-200">
                       <span>{t('r_fin_activities')}</span>
                       <span className={financingActivities >= 0 ? 'text-green-700' : 'text-red-700'}>${financingActivities.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between font-bold text-lg pt-4 mt-4 bg-gray-50 p-2">
                       <span>{t('r_net_cash_flow')}</span>
                       <span className={netCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}>${netCashFlow.toFixed(2)}</span>
                   </div>

                   <div className="mt-10 pt-4 border-t border-dashed border-gray-300">
                      <h4 className="font-bold text-lg text-gray-800 mb-4">{t('transactionBreakdown')}</h4>
                      {renderTransactionList(t('r_op_activities'), details?.operatingTransactions || [])}
                      {renderTransactionList(t('r_inv_activities'), details?.investingTransactions || [])}
                      {renderTransactionList(t('r_fin_activities'), details?.financingTransactions || [])}
                  </div>
               </div>
           )
      }
      return null;
  }

  return (
    <div className="p-4 md:p-8 h-full">
      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 no-print">
              <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
                  <div className="flex flex-col items-center text-center">
                      <div className="bg-blue-100 p-3 rounded-full mb-4">
                          <AlertCircle className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{t('confirmGenerateTitle')}</h3>
                      <p className="text-gray-500 mb-6 text-sm">{t('confirmGenerateMsg')}</p>
                      
                      <div className="flex w-full gap-3">
                          <button 
                             onClick={() => setConfirmModal({isOpen: false})}
                             className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                          >
                              {t('cancel')}
                          </button>
                          <button 
                             onClick={confirmGeneration}
                             className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                          >
                              {t('confirm')}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <div className="flex justify-between items-center mb-6 no-print">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('financialStatements')}</h2>
          <p className="text-gray-500">{t('generateReportsDesc')}</p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* Top Section: Period & Generate Buttons (Stacked Vertically) */}
        <div className="no-print bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <div className="flex flex-col gap-6">
                {/* Period Selection */}
                <div>
                     <h3 className="font-semibold mb-3 text-sm text-gray-700 flex items-center gap-2">
                        <Calendar size={16}/> {t('periodSelection')}
                     </h3>
                     <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-xs text-gray-500 block mb-1">{t('startDate')}</label>
                            <input 
                                type="date" 
                                value={generationRange.start}
                                onChange={e => setGenerationRange(p => ({...p, start: e.target.value}))}
                                className="w-full text-sm p-2 border rounded-lg outline-none bg-white text-black focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-gray-500 block mb-1">{t('endDate')}</label>
                            <input 
                                type="date" 
                                value={generationRange.end}
                                onChange={e => setGenerationRange(p => ({...p, end: e.target.value}))}
                                className="w-full text-sm p-2 border rounded-lg outline-none bg-white text-black focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>
                </div>

                {/* Generate Buttons (Below Period) */}
                <div className="pt-4 border-t border-gray-100">
                     <h3 className="font-semibold mb-3 text-sm text-gray-700">{t('generate')}</h3>
                     <div className="flex flex-col gap-3">
                        {Object.values(ReportType).map((type) => (
                            <button
                                key={type}
                                onClick={() => initiateGeneration(type)}
                                className="flex items-center justify-center gap-3 px-4 py-3 text-sm border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all font-medium bg-white shadow-sm"
                            >
                                <FileText size={18} />
                                <span className="truncate font-semibold">{type}</span>
                            </button>
                        ))}
                     </div>
                </div>
             </div>
        </div>

        {/* Middle Section: Report History Table */}
        <div className="no-print bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-4 border-b border-gray-100 bg-gray-50">
                 <h3 className="font-semibold text-sm text-gray-700">{t('reportHistory')}</h3>
             </div>
             <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="bg-white text-gray-500 uppercase text-xs sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 text-left bg-gray-50">{t('folio')}</th>
                            <th className="px-6 py-3 text-left bg-gray-50">{t('type')}</th>
                            <th className="px-6 py-3 text-left bg-gray-50">{t('period')}</th>
                            <th className="px-6 py-3 text-right bg-gray-50">{t('generationDate')}</th>
                            <th className="px-6 py-3 text-center bg-gray-50">{t('action')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {reports.length === 0 && (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">{t('noReports')}</td></tr>
                        )}
                        {reports.map((r) => (
                            <tr key={r.folio} className={`hover:bg-blue-50 transition-colors ${selectedReport?.folio === r.folio ? 'bg-blue-50' : ''}`}>
                                <td className="px-6 py-3 font-mono text-gray-600">{r.folio}</td>
                                <td className="px-6 py-3 font-medium text-gray-800">{r.type}</td>
                                <td className="px-6 py-3 text-gray-500">{r.periodStart} to {r.periodEnd}</td>
                                <td className="px-6 py-3 text-right text-gray-500">{new Date(r.dateGenerated).toLocaleDateString()}</td>
                                <td className="px-6 py-3 text-center">
                                    <button 
                                        onClick={() => setSelectedReport(r)}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all text-xs font-medium"
                                    >
                                        <Eye size={14} /> {t('view')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>

        {/* Bottom Section: Report Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 relative min-h-[500px]">
            {!selectedReport && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <FileText className="w-16 h-16 mb-4 text-gray-200" />
                    <p>{t('selectRangePrompt')}</p>
                </div>
            )}

            {selectedReport && (
                <div className="max-w-4xl mx-auto">
                    {/* Toolbar */}
                     <div className="flex justify-end gap-2 no-print mb-6 sticky top-0 bg-white z-20 py-2 border-b">
                        {!selectedReport.aiAnalysis && (
                            <button 
                                onClick={() => analyzeReport(selectedReport.folio)}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-4 py-2 text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                            >
                                {isLoading ? <Sparkles className="animate-spin" size={16} /> : <BrainCircuit size={16} />}
                                Analyze with Gemini AI
                            </button>
                        )}
                         <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
                             <Download size={16} /> Download PDF
                         </button>
                    </div>

                    {/* PDF Content Area */}
                    <div id="report-content" className="bg-white p-8 text-black">
                        {/* Formal Company Header */}
                        <div className="flex items-start justify-between mb-8 border-b-2 border-black pb-6">
                            <div className="flex items-center gap-4">
                                {selectedReport.companySnapshot.logoUrl && (
                                    <img src={selectedReport.companySnapshot.logoUrl} alt="Logo" className="h-20 w-auto object-contain" />
                                )}
                                <div>
                                    <h1 className="text-xl font-bold uppercase tracking-wider text-black">{selectedReport.companySnapshot.name}</h1>
                                    <p className="text-xs text-gray-600">{selectedReport.companySnapshot.address}</p>
                                    <p className="text-xs text-gray-600">Tax ID: {selectedReport.companySnapshot.taxId}</p>
                                </div>
                            </div>
                            <div className="text-right text-black">
                                <h2 className="text-2xl font-bold mb-1">{selectedReport.type}</h2>
                                <p className="text-sm">{t('period')}: {selectedReport.periodStart} - {selectedReport.periodEnd}</p>
                                <p className="text-sm">{t('folio')}: <span className="font-mono font-bold">{selectedReport.folio}</span></p>
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="mb-10">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide border-b border-gray-400 pb-1">{t('statementDetails')}</h3>
                            {renderReportData(selectedReport)}
                        </div>

                        {/* Financial Ratios */}
                        <div className="mb-8 break-inside-avoid">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide border-b border-gray-400 pb-1">{t('keyRatios')}</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {selectedReport.ratios.map((ratio, idx) => (
                                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200 break-inside-avoid">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-gray-800">{ratio.name}</span>
                                            <span className="font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">{ratio.value}</span>
                                        </div>
                                        {ratio.analysis && (
                                            <p className="text-sm text-gray-700 italic">"{ratio.analysis}"</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI Analysis Section - Only show if available */}
                        {selectedReport.aiAnalysis ? (
                            <div className="bg-purple-50 p-6 rounded-xl mb-8 border border-purple-100 break-inside-avoid">
                                <h3 className="flex items-center gap-2 text-purple-900 font-bold mb-3 uppercase tracking-wide text-sm">
                                    <Sparkles size={16} /> 
                                    {t('cfoSummary')}
                                </h3>
                                <p className="text-purple-900 leading-relaxed text-sm text-justify">
                                    {selectedReport.aiAnalysis}
                                </p>
                            </div>
                        ) : (
                             <div className="p-4 text-center text-gray-400 border border-dashed border-gray-300 rounded-lg mb-8 text-sm no-print">
                                 AI Analysis not generated yet. Click "Analyze with Gemini AI" to generate insights.
                             </div>
                        )}

                        {/* Footer */}
                        <div className="mt-12 pt-8 border-t border-gray-300 flex justify-between items-end text-xs text-gray-600">
                            <div>
                                <p>{t('generatedBy')}: {selectedReport.generatedBy}</p>
                                <p>{t('generationDate')}: {new Date(selectedReport.dateGenerated).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="mb-8 border-b border-black w-48"></p>
                                <p>{t('authorizedSignature')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};