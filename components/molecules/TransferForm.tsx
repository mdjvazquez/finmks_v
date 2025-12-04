import React, { useState } from "react";
import {
  Transaction,
  ActivityGroup,
  TransactionType,
  AccountType,
  TransactionStatus,
} from "../../types";
import { Button } from "../atoms/Button";
import { Input, Select } from "../atoms/Input";
import { useFinance } from "../../context/FinancialContext";
import { AlertCircle, ArrowRightLeft } from "lucide-react";

interface TransferFormProps {
  onSubmit: (transaction: Transaction) => void;
  onCancel: () => void;
}

export const TransferForm: React.FC<TransferFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const { cashRegisters, t, currentCompany } = useFinance();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    description: "",
    originId:
      cashRegisters.find((r) => r.isDefault)?.id || cashRegisters[0]?.id || "",
    destinationId: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (
      !formData.amount ||
      !formData.date ||
      !formData.originId ||
      !formData.destinationId ||
      !formData.description
    ) {
      setError(t("fillAllRequired"));
      return;
    }

    if (formData.originId === formData.destinationId) {
      setError("Origin and Destination cannot be the same.");
      return;
    }

    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Invalid Amount.");
      return;
    }

    const newTransfer: Transaction = {
      id: crypto.randomUUID(),
      date: formData.date,
      description: formData.description,
      amount: amountNum,
      group: ActivityGroup.FINANCING, // Internal movement
      type: TransactionType.TRANSFER,
      accountType: AccountType.CASH,
      status: TransactionStatus.PAID,
      cashRegisterId: formData.originId,
      destinationCashRegisterId: formData.destinationId,
      companyId: currentCompany?.id || "",
    };

    onSubmit(newTransfer);
  };

  const originRegister = cashRegisters.find((r) => r.id === formData.originId);
  const currentBalance = originRegister?.balance || 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm animate-in fade-in">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        {/* Visual Connector for Desktop */}
        <div className="hidden md:flex absolute top-8 left-1/2 -translate-x-1/2 z-10 bg-white p-1 rounded-full border border-gray-200 text-gray-400">
          <ArrowRightLeft size={16} />
        </div>

        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
          <Select
            label={t("originCaja")}
            value={formData.originId}
            onChange={(e) =>
              setFormData({ ...formData, originId: e.target.value })
            }
            options={cashRegisters.map((r) => ({ value: r.id, label: r.name }))}
            className="bg-white"
          />
          <p className="text-xs text-red-600 mt-2 font-medium text-right">
            Available: ${currentBalance.toLocaleString()}
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
          <Select
            label={t("destinationCaja")}
            value={formData.destinationId}
            onChange={(e) =>
              setFormData({ ...formData, destinationId: e.target.value })
            }
            required
            options={[
              { value: "", label: "- Select -" },
              ...cashRegisters
                .filter((r) => r.id !== formData.originId)
                .map((r) => ({ value: r.id, label: r.name })),
            ]}
            className="bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t("amount")}
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          required
          step="0.01"
          placeholder="0.00"
        />
        <Input
          label={t("date")}
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
      </div>

      <Input
        label={t("description")}
        value={formData.description}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        required
        placeholder="e.g. Petty Cash Replenishment"
      />

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
        >
          {t("cancel")}
        </Button>
        <Button type="submit" className="flex-1">
          {t("transferFunds")}
        </Button>
      </div>
    </form>
  );
};
