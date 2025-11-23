import React, { useState } from "react";
import { FinancialProvider, useFinance } from "./context/FinancialContext";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { Transactions } from "./pages/Transactions";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { Notifications } from "./pages/Notifications";
import { Login } from "./pages/Login";
import { Menu } from "lucide-react";

const AppContent: React.FC = () => {
  const { currentUser } = useFinance();
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!currentUser) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "transactions":
        return <Transactions />;
      case "reports":
        return <Reports />;
      case "settings":
        return <Settings />;
      case "notifications":
        return <Notifications />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 z-50 flex items-center px-4 justify-between no-print">
        <span className="text-white font-bold text-lg">FinGemini</span>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-white"
        >
          <Menu />
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-200 ease-in-out md:static`}
      >
        <Sidebar
          currentPage={currentPage}
          setPage={(page) => {
            setCurrentPage(page);
            setSidebarOpen(false);
          }}
        />
      </div>

      <main className="flex-1 h-screen overflow-auto md:ml-0 pt-16 md:pt-0 print:pt-0 print:h-auto print:overflow-visible">
        {renderPage()}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <FinancialProvider>
      <AppContent />
    </FinancialProvider>
  );
};

export default App;
