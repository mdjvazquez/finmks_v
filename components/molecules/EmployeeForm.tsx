import React, { useState } from "react";
import { Employee } from "../../types";
import { Button } from "../atoms/Button";
import { Input, Select } from "../atoms/Input";
import { useFinance } from "../../context/FinancialContext";

interface EmployeeFormProps {
  initialData?: Employee;
  onSubmit: (data: Partial<Employee>) => void;
  onCancel: () => void;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const { t } = useFinance();
  const [formData, setFormData] = useState<Partial<Employee>>(
    initialData || {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      position: "",
      department: "",
      salary: 0,
      hireDate: new Date().toISOString().split("T")[0],
      status: "ACTIVE",
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t("firstName")}
          value={formData.firstName}
          onChange={(e) =>
            setFormData({ ...formData, firstName: e.target.value })
          }
          required
        />
        <Input
          label={t("lastName")}
          value={formData.lastName}
          onChange={(e) =>
            setFormData({ ...formData, lastName: e.target.value })
          }
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t("email")}
          type="email"
          value={formData.email || ""}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <Input
          label={t("phone")}
          value={formData.phone || ""}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t("position")}
          value={formData.position || ""}
          onChange={(e) =>
            setFormData({ ...formData, position: e.target.value })
          }
        />
        <Input
          label={t("department")}
          value={formData.department || ""}
          onChange={(e) =>
            setFormData({ ...formData, department: e.target.value })
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t("salary")}
          type="number"
          value={formData.salary}
          onChange={(e) =>
            setFormData({ ...formData, salary: parseFloat(e.target.value) })
          }
          required
        />
        <Input
          label={t("hireDate")}
          type="date"
          value={formData.hireDate}
          onChange={(e) =>
            setFormData({ ...formData, hireDate: e.target.value })
          }
          required
        />
      </div>
      <Select
        label={t("status")}
        value={formData.status}
        onChange={(e) =>
          setFormData({ ...formData, status: e.target.value as any })
        }
        options={[
          { value: "ACTIVE", label: t("active") },
          { value: "INACTIVE", label: t("inactive") },
          { value: "ON_LEAVE", label: t("onLeave") },
        ]}
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
        <Button type="submit" className="flex-1">
          {t("save")}
        </Button>
      </div>
    </form>
  );
};
