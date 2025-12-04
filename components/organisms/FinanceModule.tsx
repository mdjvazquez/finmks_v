import React from "react";
import { Dashboard } from "../../pages/Dashboard";
import { Transactions } from "../../pages/Transactions";
import { CashRegisters } from "../../pages/CashRegisters";
import { Reports } from "../../pages/Reports";
import { Notifications } from "../../pages/Notifications";
import { useFinance } from "../../context/FinancialContext";
import { ShieldAlert } from "lucide-react";

interface FinanceModuleProps {
  currentView: string;
}

const AccessRestricted = () => (
  <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50 animate-in fade-in">
    <div className="bg-gray-100 p-6 rounded-full mb-4">
      <ShieldAlert size={48} className="text-gray-300" />
    </div>
    <h3 className="text-lg font-semibold text-gray-600 mb-2">
      Access Restricted
    </h3>
    <p className="text-sm text-gray-500 max-w-xs text-center">
      You do not have permission to view this module. Please contact your
      administrator.
    </p>
  </div>
);

export const FinanceModule: React.FC<FinanceModuleProps> = ({
  currentView,
}) => {
  const { checkPermission } = useFinance();

  // Master Permission Check for the Organism
  if (!checkPermission("finances_organism.view")) {
    return <AccessRestricted />;
  }

  // Render specific view based on prop and granular view permissions
  switch (currentView) {
    case "dashboard":
      return checkPermission("dashboard.view") ? (
        <Dashboard />
      ) : (
        <AccessRestricted />
      );
    case "transactions":
      return checkPermission("transactions.view") ? (
        <Transactions />
      ) : (
        <AccessRestricted />
      );
    case "cashRegisters":
      return checkPermission("cash_registers.view") ? (
        <CashRegisters />
      ) : (
        <AccessRestricted />
      );
    case "reports":
      return checkPermission("reports.view") ? (
        <Reports />
      ) : (
        <AccessRestricted />
      );
    case "notifications":
      return checkPermission("notifications.view") ? (
        <Notifications />
      ) : (
        <AccessRestricted />
      );
    default:
      return <Dashboard />; // Default fallback
  }
};
