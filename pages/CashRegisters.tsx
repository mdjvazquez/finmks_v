import React, { useState, useEffect } from "react";
import { useFinance } from "../context/FinancialContext";
import { Button } from "../components/atoms/Button";
import { Card } from "../components/atoms/Card";
import { LoadingState } from "../components/atoms/LoadingState";
import { Modal } from "../components/molecules/Modal";
import { Input } from "../components/atoms/Input";
import {
  Plus,
  Wallet,
  Trash2,
  ArrowRightLeft,
  CreditCard,
  FileText,
  Download,
  Edit,
} from "lucide-react";
import { UserRole, Transaction, TransactionType, CashRegister } from "../types";
import { ConfirmationModal } from "../components/molecules/ConfirmationModal";
import { StatusModal } from "../components/molecules/StatusModal";
import { TransferForm } from "../components/molecules/TransferForm";
import { DateFilter } from "../components/molecules/DateFilter";

export const CashRegisters: React.FC = () => {
  const {
    cashRegisters,
    addCashRegister,
    updateCashRegister,
    deleteCashRegister,
    currentUser,
    t,
    isLoading,
    addTransfer,
    transactions,
    companySettings,
  } = useFinance();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Date Filter for Report
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  // Form States
  const [newRegName, setNewRegName] = useState("");
  const [newRegDesc, setNewRegDesc] = useState("");
  const [editingRegister, setEditingRegister] = useState<CashRegister | null>(
    null
  );

  // Status & Confirm
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    message: string;
  }>({ isOpen: false, type: "success", message: "" });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const openAddModal = () => {
    setEditingRegister(null);
    setNewRegName("");
    setNewRegDesc("");
    setIsAddModalOpen(true);
  };

  const openEditModal = (reg: CashRegister) => {
    setEditingRegister(reg);
    setNewRegName(reg.name);
    setNewRegDesc(reg.description || "");
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let result;

    if (editingRegister) {
      result = await updateCashRegister(
        editingRegister.id,
        newRegName,
        newRegDesc
      );
    } else {
      result = await addCashRegister(newRegName, newRegDesc);
    }

    setIsAddModalOpen(false);
    setNewRegName("");
    setNewRegDesc("");
    setEditingRegister(null);

    if (result.success) {
      setStatusModal({
        isOpen: true,
        type: "success",
        message: editingRegister
          ? "Cash Register Updated"
          : "Cash Register Created",
      });
    } else {
      setStatusModal({
        isOpen: true,
        type: "error",
        message: result.error || "Error saving register",
      });
    }
  };

  const handleDelete = async () => {
    if (confirmDeleteId) {
      const result = await deleteCashRegister(confirmDeleteId);
      setConfirmDeleteId(null);
      if (result.success) {
        setStatusModal({
          isOpen: true,
          type: "success",
          message: "Cash Register Deleted",
        });
      } else {
        setStatusModal({
          isOpen: true,
          type: "error",
          message: result.error || "Error deleting register",
        });
      }
    }
  };

  const handleTransferSubmit = async (data: Transaction) => {
    setIsTransferModalOpen(false);
    const result = await addTransfer(data);
    if (result.success) {
      setStatusModal({
        isOpen: true,
        type: "success",
        message: "Transfer Successful",
      });
    } else {
      setStatusModal({
        isOpen: true,
        type: "error",
        message: result.error || "Transfer Failed",
      });
    }
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById("register-report-content");
    if (!element) return;

    const opt = {
      margin: 10,
      filename: `RegisterReport_${dateRange.start}_${dateRange.end}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    // @ts-ignore
    if (window.html2pdf) {
      // @ts-ignore
      window.html2pdf().set(opt).from(element).save();
    } else {
      window.print();
    }
  };

  const getRegName = (id?: string) => {
    if (!id) return "-";
    return cashRegisters.find((r) => r.id === id)?.name || id;
  };

  const renderReportContent = () => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59, 999);

    // Filter and Sort Transactions Chronologically
    const filteredTxs = transactions
      .filter((t) => {
        const tDate = new Date(t.date);
        return tDate >= start && tDate <= end;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
      <div
        id="register-report-content"
        className="bg-white p-8 text-black min-h-[600px]"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-8 border-b-2 border-black pb-6">
          <div className="flex items-center gap-4">
            {companySettings.logoUrl && (
              <img
                src={companySettings.logoUrl}
                alt="Logo"
                className="h-16 w-auto object-contain"
              />
            )}
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wider text-black">
                {companySettings.name}
              </h1>
              <p className="text-xs text-gray-600">{companySettings.address}</p>
            </div>
          </div>
          <div className="text-right text-black">
            <h2 className="text-2xl font-bold mb-1">
              {t("cashRegisterReport")}
            </h2>
            <p className="text-sm">
              {t("period")}: {dateRange.start} - {dateRange.end}
            </p>
            <p className="text-sm">
              {t("generatedBy")}: {currentUser?.name}
            </p>
          </div>
        </div>

        {/* Unified Transaction Table */}
        <div className="mb-10">
          <table className="w-full text-xs font-mono mb-4">
            <thead>
              <tr className="border-b-2 border-gray-400 bg-gray-100 text-left">
                <th className="py-2 px-2 uppercase text-gray-900">
                  {t("date")}
                </th>
                <th className="py-2 px-2 uppercase text-gray-900">
                  {t("description")}
                </th>
                <th className="py-2 px-2 uppercase text-gray-900">
                  {t("originRegister")}
                </th>
                <th className="py-2 px-2 uppercase text-gray-900">
                  {t("destinationRegister")}
                </th>
                <th className="py-2 px-2 text-right uppercase text-gray-900">
                  {t("amount")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTxs.map((tx) => {
                const isTransfer = tx.type === TransactionType.TRANSFER;
                const isIncome = tx.type === TransactionType.INCOME;

                let origin = "-";
                let destination = "-";

                if (isTransfer) {
                  origin = getRegName(tx.cashRegisterId);
                  destination = getRegName(tx.destinationCashRegisterId);
                } else if (isIncome) {
                  origin = t("externalSource");
                  destination = getRegName(tx.cashRegisterId);
                } else {
                  // Expense
                  origin = getRegName(tx.cashRegisterId);
                  destination = t("externalSource");
                }

                return (
                  <tr
                    key={tx.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-2 px-2 text-gray-900">{tx.date}</td>
                    <td className="py-2 px-2 font-medium text-gray-900">
                      {tx.description}
                    </td>
                    <td className="py-2 px-2 text-gray-900">{origin}</td>
                    <td className="py-2 px-2 text-gray-900">{destination}</td>
                    <td
                      className={`py-2 px-2 text-right font-bold ${
                        isIncome
                          ? "text-green-700"
                          : isTransfer
                          ? "text-blue-700"
                          : "text-red-700"
                      }`}
                    >
                      ${tx.amount.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              {filteredTxs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-gray-500 italic"
                  >
                    No transactions found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Final Balances Section */}
        <div className="mt-8 border-t border-gray-300 pt-6 break-inside-avoid">
          <h3 className="font-bold text-lg uppercase tracking-wider mb-4 text-gray-900">
            {t("currentBalances")}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {cashRegisters.map((reg) => (
              <div
                key={reg.id}
                className="bg-gray-50 p-3 rounded border border-gray-200"
              >
                <p className="text-xs text-gray-500 font-bold uppercase">
                  {reg.name}
                </p>
                <p
                  className={`text-lg font-mono font-bold ${
                    (reg.balance || 0) >= 0 ? "text-black" : "text-red-600"
                  }`}
                >
                  $
                  {(reg.balance || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) return <LoadingState />;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col justify-between items-start mb-6 gap-4 lg:flex-row lg:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {t("manageCashRegisters")}
          </h2>
          <p className="text-gray-500">{t("cashRegisterDesc")}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center w-full lg:w-auto">
          {/* Report Tools */}
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
            <DateFilter
              startDate={dateRange.start}
              endDate={dateRange.end}
              onChange={(s, e) => setDateRange({ start: s, end: e })}
              onClear={() => {}}
              className="border-0 shadow-none"
            />
            <Button
              variant="secondary"
              onClick={() => setIsReportModalOpen(true)}
              className="h-9 px-3 text-xs"
              icon={<FileText size={14} />}
            >
              {t("generateRegisterReport")}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setIsTransferModalOpen(true)}
              variant="secondary"
              icon={<ArrowRightLeft size={18} />}
            >
              {t("transferFunds")}
            </Button>
            {isAdmin && (
              <Button onClick={openAddModal} icon={<Plus size={18} />}>
                {t("addCashRegister")}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cashRegisters.map((reg) => (
          <Card
            key={reg.id}
            className="relative group hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Wallet size={24} />
              </div>
              {isAdmin && (
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(reg)}
                    className="text-gray-300 hover:text-blue-500 transition-colors p-1"
                    title={t("editRegister")}
                  >
                    <Edit size={16} />
                  </button>
                  {!reg.isDefault && (
                    <button
                      onClick={() => setConfirmDeleteId(reg.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                      title={t("confirmDelete")}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-1">{reg.name}</h3>
            <p className="text-sm text-gray-500 mb-4 h-10 line-clamp-2">
              {reg.description || "No description"}
            </p>

            <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">
                  {t("currentBalance")}
                </p>
                <p
                  className={`text-xl font-mono font-bold ${
                    (reg.balance || 0) >= 0 ? "text-gray-800" : "text-red-600"
                  }`}
                >
                  $
                  {(reg.balance || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              {reg.isDefault && (
                <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded-full font-bold uppercase">
                  {t("default")}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {cashRegisters.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Wallet size={48} className="mx-auto mb-4 opacity-20" />
          <p>{t("noRegisters")}</p>
        </div>
      )}

      {/* Add/Edit Register Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingRegister ? t("editRegister") : t("addCashRegister")}
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input
            label={t("registerName")}
            value={newRegName}
            onChange={(e) => setNewRegName(e.target.value)}
            required
          />
          <Input
            label={t("description")}
            value={newRegDesc}
            onChange={(e) => setNewRegDesc(e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1"
            >
              {t("cancel")}
            </Button>
            <Button type="submit" className="flex-1">
              {editingRegister ? t("update") : t("save")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transfer Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title={t("newTransfer")}
        maxWidth="max-w-2xl"
      >
        <TransferForm
          onSubmit={handleTransferSubmit}
          onCancel={() => setIsTransferModalOpen(false)}
        />
      </Modal>

      {/* Report Preview Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title={t("cashRegisterReport")}
        maxWidth="max-w-4xl"
      >
        <div className="flex justify-end mb-4 gap-2">
          <Button
            variant="secondary"
            onClick={() => setIsReportModalOpen(false)}
          >
            {t("close")}
          </Button>
          <Button onClick={handleDownloadPDF} icon={<Download size={16} />}>
            {t("downloadReport")}
          </Button>
        </div>
        <div className="max-h-[600px] overflow-y-auto border border-gray-200 rounded-lg">
          {renderReportContent()}
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            variant="secondary"
            onClick={() => setIsReportModalOpen(false)}
          >
            {t("closePreview")}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title={t("confirmDelete")}
        message={t("deleteRegisterMsg")}
        confirmText={t("confirmDelete")}
        cancelText={t("cancel")}
      />

      {/* Status Modal */}
      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal((prev) => ({ ...prev, isOpen: false }))}
        type={statusModal.type}
        message={statusModal.message}
      />
    </div>
  );
};
