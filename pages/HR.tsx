import React, { useState } from "react";
import { useFinance } from "../context/FinancialContext";
import { Employee } from "../types";
import { Button } from "../components/atoms/Button";
import { Modal } from "../components/molecules/Modal";
import { StatusModal } from "../components/molecules/StatusModal";
import { ConfirmationModal } from "../components/molecules/ConfirmationModal";
import { EmployeeForm } from "../components/molecules/EmployeeForm";
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Briefcase,
} from "lucide-react";

export const HR: React.FC = () => {
  const {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    t,
    checkPermission,
  } = useFinance();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(
    undefined
  );
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    message: string;
  }>({ isOpen: false, type: "success", message: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const canCreate = checkPermission("employees.create");
  const canEdit = checkPermission("employees.edit");
  const canDelete = checkPermission("employees.delete");

  const handleOpenAdd = () => {
    setEditingEmployee(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: Partial<Employee>) => {
    setIsFormOpen(false);
    let result;
    if (editingEmployee) {
      result = await updateEmployee(editingEmployee.id, data);
    } else {
      result = await addEmployee(data);
    }

    if (result.success) {
      setStatusModal({
        isOpen: true,
        type: "success",
        message: t("employeeSaved"),
      });
    } else {
      setStatusModal({
        isOpen: true,
        type: "error",
        message: result.error || "Error",
      });
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      const result = await deleteEmployee(deleteId);
      setDeleteId(null);
      if (result.success) {
        setStatusModal({
          isOpen: true,
          type: "success",
          message: "Employee deleted",
        });
      } else {
        setStatusModal({
          isOpen: true,
          type: "error",
          message: result.error || "Error",
        });
      }
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {t("manageEmployees")}
          </h2>
          <p className="text-gray-500">{t("employeesDesc")}</p>
        </div>
        {canCreate && (
          <Button onClick={handleOpenAdd} icon={<UserPlus size={18} />}>
            {t("addEmployee")}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((emp) => (
          <div
            key={emp.id}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {emp.firstName.charAt(0)}
                  {emp.lastName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    {emp.firstName} {emp.lastName}
                  </h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      emp.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {t(
                      emp.status === "ACTIVE"
                        ? "active"
                        : emp.status === "INACTIVE"
                        ? "inactive"
                        : "onLeave"
                    )}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {canEdit && (
                  <button
                    onClick={() => handleOpenEdit(emp)}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 size={16} />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => setDeleteId(emp.id)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Briefcase size={14} className="text-gray-400" />
                <span>{emp.position || "-"}</span>
                {emp.department && (
                  <span className="text-xs bg-gray-100 px-1.5 rounded text-gray-500">
                    {emp.department}
                  </span>
                )}
              </div>
              {emp.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-gray-400" />
                  <span className="truncate">{emp.email}</span>
                </div>
              )}
              {emp.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-gray-400" />
                  <span>{emp.phone}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {employees.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 flex flex-col items-center">
            <Users size={48} className="opacity-20 mb-4" />
            <p>{t("noEmployees")}</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingEmployee ? t("editEmployee") : t("addEmployee")}
      >
        <EmployeeForm
          initialData={editingEmployee}
          onSubmit={handleSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t("confirmDelete")}
        message={t("deleteEmployeeConfirm")}
        confirmText={t("confirmDelete")}
        cancelText={t("cancel")}
      />

      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal((prev) => ({ ...prev, isOpen: false }))}
        type={statusModal.type}
        message={statusModal.message}
      />
    </div>
  );
};
