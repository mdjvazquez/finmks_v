import React, { useState } from 'react';
import { Sidebar } from '../organisms/Sidebar';
import { Menu } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  setPage: (page: string) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, currentPage, setPage }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handlePageChange = (page: string) => {
    setPage(page);
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 z-50 flex items-center px-4 justify-between no-print shadow-md">
         <span className="text-white font-bold text-lg flex items-center gap-2">FinMakes</span>
         <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white p-2">
            <Menu />
         </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden animate-in fade-in" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-200 ease-in-out md:static shadow-xl md:shadow-none`}>
         <Sidebar currentPage={currentPage} setPage={handlePageChange} />
      </div>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-auto md:ml-0 pt-16 md:pt-0 print:pt-0 print:h-auto print:overflow-visible scroll-smooth">
        {children}
      </main>
    </div>
  );
};