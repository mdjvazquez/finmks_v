import React, { useState } from "react";
import { FinancialProvider, useFinance } from "./context/FinancialContext";
import { MainLayout } from "./components/templates/MainLayout";
import { Settings } from "./pages/Settings";
import { Login } from "./pages/Login";
import { FinanceModule } from "./components/organisms/FinanceModule";
import { HR } from "./pages/HR";

const AppContent = () => {
  const { currentUser, checkPermission } = useFinance();
  const [currentPage, setCurrentPage] = useState("dashboard");

  if (!currentUser) {
    return <Login />;
  }

  // Routing Logic
  const renderContent = () => {
    switch (currentPage) {
      case "settings":
        return <Settings />;
      case "hr":
        return checkPermission("hr_organism.view") ? (
          <HR />
        ) : (
          <div>Access Restricted</div>
        );
      default:
        return <FinanceModule currentView={currentPage} />;
    }
  };

  return (
    <MainLayout currentPage={currentPage} setPage={setCurrentPage}>
      {renderContent()}
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
