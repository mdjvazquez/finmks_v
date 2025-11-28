import React, { useState } from "react";
import { FinancialProvider, useFinance } from "./context/FinancialContext";
import { MainLayout } from "./components/templates/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { Transactions } from "./pages/Transactions";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { Notifications } from "./pages/Notifications";
import { Login } from "./pages/Login";
import { CashRegisters } from "./pages/CashRegisters";

const AppContent = () => {
  const { currentUser } = useFinance();
  const [currentPage, setCurrentPage] = useState("dashboard");

  if (!currentUser) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "transactions":
        return <Transactions />;
      case "cashRegisters":
        return <CashRegisters />;
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
    <MainLayout currentPage={currentPage} setPage={setCurrentPage}>
      {renderPage()}
    </MainLayout>
  );
};

const App = () => {
  return (
    <FinancialProvider>
      <AppContent />
    </FinancialProvider>
  );
};

export default App;
