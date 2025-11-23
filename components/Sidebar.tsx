import React from "react";
import {
  LayoutDashboard,
  Receipt,
  FileText,
  LogOut,
  PieChart,
  Settings,
  Bell,
} from "lucide-react";
import { useFinance } from "../context/FinancialContext";

interface SidebarProps {
  currentPage: string;
  setPage: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setPage }) => {
  const { currentUser, logout, t } = useFinance();

  const navItems = [
    { id: "dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { id: "transactions", label: t("movements"), icon: Receipt },
    { id: "reports", label: t("reports"), icon: FileText },
    { id: "notifications", label: t("notifications"), icon: Bell },
    { id: "settings", label: t("settings"), icon: Settings },
  ];

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col h-full md:h-screen md:sticky md:top-0 no-print shadow-xl">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <PieChart className="text-blue-400" />
          FinMKS
        </h1>
      </div>

      <div className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentPage === item.id
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-slate-700 bg-slate-900">
        <div className="flex items-center gap-3 mb-4 px-2">
          <img
            src={currentUser?.avatar}
            alt="User"
            className="w-8 h-8 rounded-full bg-slate-800"
          />
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold truncate">
              {currentUser?.name}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {currentUser.role}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          {t("signOut")}
        </button>
      </div>
    </div>
  );
};
