import React, { useState, useRef } from "react";
import {
  Transaction,
  ActivityGroup,
  TransactionType,
  AccountType,
  TransactionStatus,
  UserRole,
} from "../../types";
import { analyzeReceiptImage } from "../../services/geminiService";
import { Camera, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "../atoms/Button";
import { Input, Select } from "../atoms/Input";
import { useFinance } from "../../context/FinancialContext";

interface TransactionFormProps {
  onSubmit: (transaction: Transaction) => void;
  onCancel: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const { companySettings, currentUser, t, cashRegisters, currentCompany } =
    useFinance();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [addTax, setAddTax] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Using any here to allow amount to be string during editing (for decimal support and clearing)
  const [formData, setFormData] = useState<any>({
    date: new Date().toISOString().split("T")[0],
    type: TransactionType.EXPENSE,
    group: ActivityGroup.OPERATING,
    accountType: AccountType.CASH,
    status: TransactionStatus.PAID,
    amount: 0,
    description: "",
    cashRegisterId:
      cashRegisters.find((r) => r.isDefault)?.id || cashRegisters[0]?.id || "",
  });

  const canEdit = currentUser?.role !== UserRole.VIEWER;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(",")[1];
        try {
          const result = await analyzeReceiptImage(base64Data);
          setFormData((prev) => ({
            ...prev,
            ...result,
            receiptImage: base64String,
          }));
        } catch (error) {
          setError("Could not analyze image. Please fill manually.");
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsAnalyzing(false);
    }
  };

  const handleDescriptionBlur = () => {
    if (formData.description) {
      // Sentence case: First letter upper, rest lower
      const text = String(formData.description);
      const formatted =
        text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
      setFormData((prev) => ({ ...prev, description: formatted }));
    }
  };

  const handleAccountTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as AccountType;

    // Logic: If AP/AR -> Default to PENDING. If CASH -> Default to PAID.
    let newStatus = formData.status;
    if (newType === AccountType.RECEIVABLE || newType === AccountType.PAYABLE) {
      newStatus = TransactionStatus.PENDING;
    } else if (newType === AccountType.CASH) {
      newStatus = TransactionStatus.PAID;
    }

    setFormData((prev) => ({
      ...prev,
      accountType: newType,
      status: newStatus,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Basic Required Fields Check
    if (
      !formData.description ||
      !formData.amount ||
      !formData.date ||
      !formData.cashRegisterId
    ) {
      setError(t("fillAllRequired"));
      return;
    }

    // 2. Date Logic Validation for AP/AR
    if (
      formData.accountType === AccountType.PAYABLE ||
      formData.accountType === AccountType.RECEIVABLE
    ) {
      if (!formData.dueDate) {
        setError(t("dueDate") + " is required for this account type.");
        return;
      }
      const moveDate = new Date(formData.date);
      const dueDate = new Date(formData.dueDate);
      moveDate.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      if (dueDate <= moveDate) {
        setError("The Due Date must be later than the Movement Date.");
        return;
      }
    }

    let finalAmount = Number(formData.amount);
    // Only add tax if checked
    if (addTax) finalAmount = finalAmount * (1 + companySettings.taxRate / 100);

    const newTransaction: Transaction = {
      id: crypto.randomUUID(), // Temp ID, database will assign real one
      date: formData.date,
      dueDate: formData.dueDate,
      description: formData.description,
      amount: finalAmount,
      group: formData.group as ActivityGroup,
      type: formData.type as TransactionType,
      accountType: formData.accountType as AccountType,
      status: formData.status as TransactionStatus,
      receiptImage: formData.receiptImage,
      cashRegisterId: formData.cashRegisterId,
      companyId: currentCompany?.id || "",
    };

    onSubmit(newTransaction);
  };

  const estimatedTotal = addTax
    ? Number(formData.amount || 0) * (1 + companySettings.taxRate / 100)
    : Number(formData.amount || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-1">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* AI Upload Button */}
      <div className="mb-6">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          isLoading={isAnalyzing}
          onClick={() => fileInputRef.current?.click()}
          disabled={!canEdit}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md border-0"
          icon={!isAnalyzing ? <Camera size={18} /> : undefined}
        >
          {isAnalyzing ? t("analyzing") : t("scanReceipt")}
        </Button>
        <div className="flex items-center justify-center gap-1 mt-2 text-xs text-gray-400">
          <Sparkles size={12} className="text-purple-400" />
          <span>{t("autoDetect")}</span>
        </div>
      </div>

      {/* CASH REGISTER SELECTOR */}
      <div className="grid grid-cols-1">
        <Select
          label={t("registerName")}
          value={formData.cashRegisterId}
          onChange={(e) =>
            setFormData({ ...formData, cashRegisterId: e.target.value })
          }
          disabled={!canEdit}
          options={cashRegisters.map((r) => ({
            value: r.id,
            label: r.name + (r.isDefault ? ` (${t("default")})` : ""),
          }))}
        />
      </div>

      {/* Amount and Date */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t("amount")}
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          onFocus={() => setFormData((prev) => ({ ...prev, amount: "" }))}
          disabled={!canEdit}
          required
          step="0.01"
        />
        <Input
          label={t("movementDate")}
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          disabled={!canEdit}
          required
        />
      </div>

      <Input
        label={t("description")}
        value={formData.description}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        onBlur={handleDescriptionBlur}
        disabled={!canEdit}
        required
        placeholder="e.g. Office Supplies"
      />

      {/* Flow Type Selector */}
      <Select
        label={t("flowType")}
        value={formData.type}
        disabled={!canEdit}
        onChange={(e) => {
          const newType = e.target.value as TransactionType;
          setFormData((prev) => ({
            ...prev,
            type: newType,
            accountType: prev.accountType,
            status: prev.status,
          }));
        }}
        options={Object.values(TransactionType)
          .filter((t) => t !== TransactionType.TRANSFER)
          .map((tVal) => ({ value: tVal, label: t(`val_${tVal}`) }))}
      />

      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={addTax}
            onChange={(e) => setAddTax(e.target.checked)}
            disabled={!canEdit}
            className="rounded text-blue-600 focus:ring-blue-500 bg-white"
          />
          <span className="text-sm text-gray-700 font-medium">
            {t("addTax")} ({companySettings.taxRate}%)
          </span>
        </label>
        <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-200">
          <span>{t("finalAmount")}:</span>
          <span className="font-bold text-gray-900 text-sm">
            ${estimatedTotal.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Select
          label={t("accountType")}
          value={formData.accountType}
          disabled={!canEdit}
          onChange={handleAccountTypeChange}
          options={Object.values(AccountType).map((tVal) => ({
            value: tVal,
            label: t(`val_${tVal}`),
          }))}
        />
      </div>

      {(formData.accountType === AccountType.PAYABLE ||
        formData.accountType === AccountType.RECEIVABLE) && (
        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
          <Input
            label={t("dueDate")}
            type="date"
            value={formData.dueDate || ""}
            onChange={(e) =>
              setFormData({ ...formData, dueDate: e.target.value })
            }
            required
            disabled={!canEdit}
          />
          <Select
            label={t("status")}
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as TransactionStatus,
              })
            }
            disabled={true}
            options={Object.values(TransactionStatus).map((s) => ({
              value: s,
              label: t(`val_${s}`),
            }))}
          />
        </div>
      )}

      <Select
        label={t("activityGroup")}
        value={formData.group}
        onChange={(e) =>
          setFormData({ ...formData, group: e.target.value as ActivityGroup })
        }
        disabled={!canEdit}
        options={Object.values(ActivityGroup).map((g) => ({
          value: g,
          label: t(`val_${g}`),
        }))}
      />

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
        >
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={!canEdit} className="flex-1">
          {t("saveMovement")}
        </Button>
      </div>
    </form>
  );
};
