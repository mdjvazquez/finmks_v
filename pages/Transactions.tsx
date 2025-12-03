import React, { useState } from "react";
import { useFinance } from "../context/FinancialContext";
import {
  Transaction,
  TransactionType,
  UserRole,
  TransactionStatus,
} from "../types";
import {
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  ShieldAlert,
} from "lucide-react";
import { Button } from "../components/atoms/Button";
import { Badge } from "../components/atoms/Badge";
import { Card } from "../components/atoms/Card";
import { LoadingState } from "../components/atoms/LoadingState";
import { TransactionForm } from "../components/molecules/TransactionForm";
import { Modal } from "../components/molecules/Modal";
import { ConfirmationModal } from "../components/molecules/ConfirmationModal";
import { StatusModal } from "../components/molecules/StatusModal";
import { DateFilter } from "../components/molecules/DateFilter";
import { Input } from "../components/atoms/Input";

export const Transactions: React.FC = () => {
  const {
    transactions,
    addTransaction,
    addTransfer,
    deleteTransaction,
    updateTransactionStatus,
    currentUser,
    t,
    isLoading,
    cashRegisters,
  } = useFinance();
  const [activeTab, setActiveTab] = useState<"ALL" | "RECEIVABLE" | "PAYABLE">(
    "ALL"
  );

  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    message: string;
  }>({ isOpen: false, type: "success", message: "" });

  // Generic Confirmation State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    actionType: "SAVE" | "DELETE" | "STATUS" | null;
    payload: any;
    title: string;
    message: string;
    confirmText?: string;
  }>({
    isOpen: false,
    actionType: null,
    payload: null,
    title: "",
    message: "",
  });

  // Restricted Delete State
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [adminAuthCode, setAdminAuthCode] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Filters
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  const canEdit = currentUser?.role !== UserRole.VIEWER;

  // --- ACTIONS ---

  const handleFormSubmit = (data: Transaction) => {
    setIsFormOpen(false);
    setConfirmConfig({
      isOpen: true,
      actionType: "SAVE",
      payload: data,
      title: t("confirmTransactionTitle"),
      message: t("verifyDetails"),
      confirmText: t("confirm"),
    });
  };

  const initiateStatusChange = (id: string, newStatus: TransactionStatus) => {
    setConfirmConfig({
      isOpen: true,
      actionType: "STATUS",
      payload: { id, status: newStatus },
      title: t("confirmUpdate"),
      message: t("confirmUpdateMsg"), // Reusing "Are you sure you want to save these changes?" or similar
      confirmText: t("confirm"),
    });
  };

  const initiateDelete = (id: string) => {
    if (currentUser?.role === UserRole.ADMIN) {
      setConfirmConfig({
        isOpen: true,
        actionType: "DELETE",
        payload: { id },
        title: t("confirmDelete"),
        message: "Are you sure you want to delete this transaction?", // Explicit message
        confirmText: t("confirmDelete"),
      });
    } else {
      // If not admin, open auth modal directly
      setPendingDeleteId(id);
      setAdminAuthCode("");
      setIsAdminAuthOpen(true);
    }
  };

  // --- CONFIRM HANDLER ---

  const executeAction = async () => {
    if (!confirmConfig.actionType) return;

    let success = false;
    let message = "";
    let errorMsg = "";

    if (confirmConfig.actionType === "SAVE") {
      const tx = confirmConfig.payload as Transaction;
      let result;
      // Determine which function to call based on Type
      if (tx.type === TransactionType.TRANSFER) {
        result = await addTransfer(tx);
      } else {
        result = await addTransaction(tx);
      }

      success = result.success;
      message = t("transactionSaved");
      errorMsg = result.error || t("transactionError");
    } else if (confirmConfig.actionType === "STATUS") {
      await updateTransactionStatus(
        confirmConfig.payload.id,
        confirmConfig.payload.status
      );
      success = true;
      message = "Status updated successfully";
    } else if (confirmConfig.actionType === "DELETE") {
      const result = await deleteTransaction(confirmConfig.payload.id);
      success = result.success;
      message = t("transactionDeleted");
      errorMsg = result.error || "Error deleting";
    }

    setConfirmConfig({ ...confirmConfig, isOpen: false });

    if (success) {
      setStatusModal({ isOpen: true, type: "success", message });
      setTimeout(
        () => setStatusModal((prev) => ({ ...prev, isOpen: false })),
        2000
      );
    } else if (errorMsg) {
      setStatusModal({ isOpen: true, type: "error", message: errorMsg });
    }
  };

  const confirmRestrictedDelete = async () => {
    if (!pendingDeleteId || !adminAuthCode) return;

    const result = await deleteTransaction(pendingDeleteId, adminAuthCode);
    setIsAdminAuthOpen(false);
    setPendingDeleteId(null);

    if (result.success) {
      setStatusModal({
        isOpen: true,
        type: "success",
        message: t("transactionDeleted"),
      });
      setTimeout(
        () => setStatusModal((prev) => ({ ...prev, isOpen: false })),
        2000
      );
    } else {
      setStatusModal({
        isOpen: true,
        type: "error",
        message: result.error || t("invalidAdminCode"),
      });
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    // STRICTLY EXCLUDE TRANSFERS from this view
    if (t.type === TransactionType.TRANSFER) return false;

    if (activeTab !== "ALL" && t.accountType !== activeTab) return false;
    if (dateRange.start && dateRange.end) {
      const tDate = new Date(t.date);
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999);
      if (tDate < start || tDate > end) return false;
    }
    return true;
  });

  if (isLoading) {
    return <LoadingState />;
  }

  // Helper to get register name
  const getRegName = (id?: string) => {
    if (!id) return "";
    return cashRegisters.find((r) => r.id === id)?.name || "Unknown";
  };

  // Helper to render details in confirmation modal
  const renderConfirmationDetails = () => {
    if (confirmConfig.actionType === "SAVE" && confirmConfig.payload) {
      const data = confirmConfig.payload as Transaction;
      const isTransfer = data.type === TransactionType.TRANSFER;

      return (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm space-y-2 text-left">
          <div className="flex justify-between border-b border-gray-200 pb-2 mb-2">
            <span className="text-gray-500">{t("description")}:</span>
            <span className="font-bold text-gray-900">{data.description}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t("amount")}:</span>
            <span className="font-bold text-blue-600 text-lg">
              ${data.amount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t("date")}:</span>
            <span className="text-gray-900">{data.date}</span>
          </div>

          {/* NEW: SHOW CASH REGISTER INFO */}
          {isTransfer ? (
            <div className="flex justify-between font-bold text-gray-800">
              <span className="text-gray-500 font-normal">Flow:</span>
              <span>
                {getRegName(data.cashRegisterId)}{" "}
                <span className="text-gray-400">→</span>{" "}
                {getRegName(data.destinationCashRegisterId)}
              </span>
            </div>
          ) : (
            <div className="flex justify-between">
              <span className="text-gray-500">{t("registerName")}:</span>
              <span className="text-gray-900 font-medium">
                {getRegName(data.cashRegisterId)}
              </span>
            </div>
          )}

          {!isTransfer && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("accountType")}:</span>
                <span className="text-gray-900">
                  {t(`val_${data.accountType}`)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("flowType")}:</span>
                <span className="text-gray-900">{t(`val_${data.type}`)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("activityGroup")}:</span>
                <span className="text-gray-900">{t(`val_${data.group}`)}</span>
              </div>

              {data.dueDate && (
                <div className="flex justify-between text-red-600 font-medium">
                  <span>{t("dueDate")}:</span>
                  <span>{data.dueDate}</span>
                </div>
              )}
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col justify-between items-start mb-8 gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {t("financialMovements")}
          </h2>
          <p className="text-gray-500">{t("manageMovements")}</p>
        </div>

        <div className="flex flex-col gap-4 w-full md:w-auto items-end">
          <Button
            onClick={() => setIsFormOpen(true)}
            icon={<Plus size={18} />}
            className="w-full md:w-auto"
          >
            {t("newTransaction")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <DateFilter
          startDate={dateRange.start}
          endDate={dateRange.end}
          onChange={(start, end) => setDateRange({ start, end })}
          onClear={() => setDateRange({ start: "", end: "" })}
          className="w-full md:w-auto self-start"
        />

        <div className="flex bg-gray-200 p-1 rounded-lg w-full md:w-auto overflow-x-auto self-start">
          {["ALL", "RECEIVABLE", "PAYABLE"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap flex-1 ${
                activeTab === tab
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab === "ALL"
                ? t("allMovements")
                : tab === "RECEIVABLE"
                ? t("accountsReceivable")
                : t("accountsPayable")}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">{t("description")}</th>
                <th className="px-6 py-3 text-left">{t("details")}</th>
                <th className="px-6 py-3 text-left">{t("status")}</th>
                <th className="px-6 py-3 text-right">{t("amount")}</th>
                <th className="px-6 py-3 text-center">{t("action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {tx.description}
                    </div>
                    <div className="text-xs text-gray-500">{tx.date}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      <Badge variant="neutral">
                        {t(`val_${tx.accountType}`)}
                      </Badge>
                      <Badge variant="info">{t(`val_${tx.group}`)}</Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {tx.status === TransactionStatus.PAID ? (
                      <Badge variant="success">
                        <CheckCircle size={10} /> {t("paid")}
                      </Badge>
                    ) : (
                      <div className="flex flex-col gap-1 items-start">
                        <Badge variant="warning">
                          <Clock size={10} /> {t("pending")}
                        </Badge>
                        {tx.dueDate && (
                          <span className="text-xs text-red-500 flex items-center gap-1">
                            <AlertTriangle size={10} /> {tx.dueDate}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td
                    className={`px-6 py-4 text-right font-bold ${
                      tx.type === TransactionType.INCOME
                        ? "text-green-600"
                        : "text-gray-900"
                    }`}
                  >
                    {tx.type === TransactionType.INCOME ? "+" : "-"}$
                    {tx.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {canEdit && tx.status === TransactionStatus.PENDING && (
                        <button
                          onClick={() =>
                            initiateStatusChange(tx.id, TransactionStatus.PAID)
                          }
                          className="p-1 text-green-500 hover:bg-green-50 rounded"
                          title="Mark as Paid"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => initiateDelete(tx.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                          title={t("confirmDelete")}
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
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    {t("noTransactions")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* --- MODALS --- */}

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={t("recordMovement")}
        maxWidth="max-w-2xl"
      >
        <TransactionForm
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      {/* Generic Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={executeAction}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText || t("confirm")}
        cancelText={t("cancel")}
        details={renderConfirmationDetails()}
      />

      {/* Admin Authorization Modal (Restricted Delete) */}
      <Modal
        isOpen={isAdminAuthOpen}
        onClose={() => {
          setIsAdminAuthOpen(false);
          setAdminAuthCode("");
        }}
        title={t("deleteRestricted")}
      >
        <div className="flex flex-col items-center text-center">
          <div className="bg-red-100 p-3 rounded-full mb-4">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-gray-600 mb-4 text-sm">
            {t("deleteRestrictedMsg")}
          </p>

          <div className="w-full mb-6">
            <Input
              placeholder="XXXX"
              value={adminAuthCode}
              onChange={(e) =>
                setAdminAuthCode(e.target.value.toUpperCase().trim())
              }
              maxLength={4}
              className="text-center font-mono text-lg tracking-widest uppercase"
            />
          </div>

          <div className="flex w-full gap-3">
            <Button
              variant="ghost"
              onClick={() => setIsAdminAuthOpen(false)}
              className="flex-1"
            >
              {t("cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={confirmRestrictedDelete}
              disabled={adminAuthCode.length !== 4}
              className="flex-1"
            >
              {t("confirmDelete")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Status Modal */}
      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal((prev) => ({ ...prev, isOpen: false }))}
        type={statusModal.type}
        message={statusModal.message}
        closeText={t("close")}
      />
    </div>
  );
};
