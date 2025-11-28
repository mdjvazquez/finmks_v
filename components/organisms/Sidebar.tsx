import React, { useState } from "react";
import {
  LayoutDashboard,
  Receipt,
  FileText,
  LogOut,
  Settings,
  Bell,
  ShieldAlert,
  Check,
  Copy,
  Wallet,
} from "lucide-react";
import { useFinance } from "../../context/FinancialContext";
import { Logo } from "../atoms/Logo";
import { APP_NAME } from "../../constants";
import { UserRole } from "../../types";
import { Modal } from "../molecules/Modal";

interface SidebarProps {
  currentPage: string;
  setPage: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setPage }) => {
  const { currentUser, logout, t, generateAdminToken } = useFinance();
  const [adminCode, setAdminCode] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const navItems = [
    { id: "dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { id: "transactions", label: t("movements"), icon: Receipt },
    { id: "cashRegisters", label: t("cashRegisters"), icon: Wallet },
    { id: "reports", label: t("reports"), icon: FileText },
    { id: "notifications", label: t("notifications"), icon: Bell },
    { id: "settings", label: t("settings"), icon: Settings },
  ];

  const handleGenerateToken = async () => {
    const response = await generateAdminToken();
    if (response.success && response.code) {
      setAdminCode(response.code);
      setIsModalOpen(true);
    } else {
      alert(`Error: ${response.error}`);
    }
  };

  const copyToClipboard = () => {
    if (adminCode) {
      navigator.clipboard.writeText(adminCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <div className="w-64 bg-gray-800 text-white flex flex-col h-full md:h-screen md:sticky md:top-0 no-print shadow-xl">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Logo className="w-8 h-8 text-blue-400" />
            {APP_NAME}
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

        <div className="p-4 border-t border-slate-700 bg-slate-900 space-y-3">
          {currentUser?.role === UserRole.ADMIN && (
            <button
              onClick={handleGenerateToken}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-yellow-500 hover:bg-slate-800 rounded-lg transition-colors border border-dashed border-yellow-500/30"
            >
              <ShieldAlert size={16} />
              {t("generateAdminCode")}
            </button>
          )}

          <div className="flex items-center gap-3 px-2 pt-2">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt="User"
                className="w-8 h-8 rounded-full bg-slate-800 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                {currentUser?.name?.charAt(0)}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate">
                {currentUser?.name}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {currentUser?.role}
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

      {/* Admin Code Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t("generateAdminCode")}
      >
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">{t("adminCodeDesc")}</p>
          <div className="bg-gray-100 p-6 rounded-xl border-2 border-dashed border-gray-300 mb-4 flex items-center justify-center">
            <span className="text-4xl font-mono font-bold tracking-widest text-gray-800">
              {adminCode}
            </span>
          </div>
          <p className="text-xs text-red-500 font-semibold mb-6">
            {t("codeValid5Min")}
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
            >
              {t("close")}
            </button>
            <button
              onClick={copyToClipboard}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? t("copied") : t("copyLink")}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
