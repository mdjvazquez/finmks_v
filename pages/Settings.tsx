import React, { useState } from "react";
import { useFinance } from "../context/FinancialContext";
import { CompanySettings, UserRole, AppRole } from "../types";
import {
  Save,
  Building2,
  UserCircle,
  Globe,
  Shield,
  KeyRound,
  Loader2,
  Settings2,
  Users,
  UserPlus,
  Mail,
  Check,
  Copy,
  UserCog,
  Plus,
  Trash2,
  Edit2,
  ShieldCheck,
} from "lucide-react";
import { UserCard } from "../components/molecules/UserCard";
import { ProfileCard } from "../components/molecules/ProfileCard";
import { CompanyCard } from "../components/molecules/CompanyCard";
import { LoadingState } from "../components/atoms/LoadingState";
import { StatusModal } from "../components/molecules/StatusModal";
import { RoleEditor } from "../components/molecules/RoleEditor";
import { Modal } from "../components/molecules/Modal";
import { Input } from "../components/atoms/Input";
import { Button } from "../components/atoms/Button";
import { ConfirmationModal } from "../components/molecules/ConfirmationModal";

export const Settings: React.FC = () => {
  const {
    companySettings,
    updateCompanySettings,
    currentUser,
    updateUserProfile,
    updateUserBio,
    requestPasswordReset,
    confirmPasswordChange,
    t,
    allUsers,
    addNewUser,
    toggleUserStatus,
    updateUserRole,
    isLoading,
    roles,
    addRole,
    updateRole,
    deleteRole,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<
    "PROFILE" | "COMPANY" | "CONFIG" | "USERS" | "ROLES"
  >("PROFILE");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    role: UserRole.VIEWER,
  });
  const [isUserActionLoading, setIsUserActionLoading] = useState(false);
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    open: boolean;
    type: "success" | "error";
    message: string;
  }>({ open: false, type: "success", message: "" });

  // Role Management State
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);
  const [editingRoleNameId, setEditingRoleNameId] = useState<string | null>(
    null
  );
  const [tempRoleName, setTempRoleName] = useState("");
  const [editPermissionsRole, setEditPermissionsRole] =
    useState<AppRole | null>(null);

  const onCompanyUpdate = async (newSettings: CompanySettings) => {
    updateCompanySettings(newSettings);
    setStatusModal({
      open: true,
      type: "success",
      message: t("settingsSaved"),
    });
    setTimeout(
      () => setStatusModal((prev) => ({ ...prev, open: false })),
      2000
    );
    return Promise.resolve();
  };

  const onProfileUpdate = async (data: any) => {
    const { success, error } = await updateUserProfile(data);
    if (success) {
      setStatusModal({
        open: true,
        type: "success",
        message: t("settingsSaved"),
      });
      setTimeout(
        () => setStatusModal((prev) => ({ ...prev, open: false })),
        2000
      );
    } else {
      setStatusModal({
        open: true,
        type: "error",
        message: error || "Error updating profile",
      });
    }
  };

  const handleLanguageChange = (lang: "EN" | "ES") => {
    updateUserProfile({ language: lang });
  };

  const initiatePasswordReset = async () => {
    setIsResetLoading(true);
    const code = await requestPasswordReset();
    setIsResetLoading(false);
    setResetStep(2);
    setStatusModal({
      open: true,
      type: "success",
      message: `${t("codeSent")} ${t("verificationCode")}: ${code}`,
    });
  };

  const finalizePasswordReset = async () => {
    setIsResetLoading(true);
    const success = await confirmPasswordChange(verificationCode, newPassword);
    setIsResetLoading(false);
    if (success) {
      setStatusModal({
        open: true,
        type: "success",
        message: t("passwordChanged"),
      });
      setShowPasswordModal(false);
      setVerificationCode("");
      setNewPassword("");
      setResetStep(1);
      setTimeout(
        () => setStatusModal((prev) => ({ ...prev, open: false })),
        2000
      );
    } else {
      setStatusModal({ open: true, type: "error", message: t("invalidCode") });
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUserActionLoading(true);
    const result = await addNewUser(newUserForm);
    setIsUserActionLoading(false);
    if (result.success && result.code) {
      setInvitationCode(result.code);
      setShowAddUserModal(false);
      setNewUserForm({ name: "", email: "", role: UserRole.VIEWER });
    } else {
      setStatusModal({
        open: true,
        type: "error",
        message: result.error || t("userCreateError"),
      });
    }
  };

  const handleCopyCode = () => {
    if (invitationCode) {
      navigator.clipboard.writeText(invitationCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    const res = await addRole(newRoleName.toUpperCase(), []);
    if (res.success) {
      setStatusModal({ open: true, type: "success", message: t("roleSaved") });
      setShowAddRoleModal(false);
      setNewRoleName("");
    } else {
      setStatusModal({
        open: true,
        type: "error",
        message: res.error || "Error",
      });
    }
  };

  const handleUpdateRolePermissions = async (
    id: string,
    updates: { permissions?: string[] }
  ) => {
    const res = await updateRole(id, updates);
    if (res.success) {
      setStatusModal({ open: true, type: "success", message: t("roleSaved") });
      setTimeout(() => {
        setStatusModal((prev) => ({ ...prev, open: false }));
        setEditPermissionsRole(null); // Close modal on success
      }, 1000);
    } else {
      setStatusModal({
        open: true,
        type: "error",
        message: res.error || "Error",
      });
    }
  };

  const confirmDeleteRole = async () => {
    if (!deleteRoleId) return;
    const res = await deleteRole(deleteRoleId);
    setDeleteRoleId(null);
    if (res.success) {
      setStatusModal({ open: true, type: "success", message: "Role deleted" });
    } else {
      setStatusModal({
        open: true,
        type: "error",
        message: res.error || "Error",
      });
    }
  };

  const openRenameModal = (role: AppRole, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRoleNameId(role.id);
    setTempRoleName(role.name);
  };

  const handleRenameRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoleNameId || !tempRoleName.trim()) return;
    const res = await updateRole(editingRoleNameId, {
      name: tempRoleName.toUpperCase(),
    });
    if (res.success) {
      setStatusModal({ open: true, type: "success", message: t("roleSaved") });
      setEditingRoleNameId(null);
    } else {
      setStatusModal({
        open: true,
        type: "error",
        message: res.error || "Error",
      });
    }
  };

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  if (isLoading) return <LoadingState />;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{t("appSettings")}</h2>
        <p className="text-gray-500">{t("managePreferences")}</p>
      </div>

      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("PROFILE")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "PROFILE"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <UserCircle size={18} /> {t("myProfile")}
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab("COMPANY")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "COMPANY"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Building2 size={18} /> {t("companyInfo")}
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => setActiveTab("USERS")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "USERS"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Users size={18} /> {t("users")}
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => setActiveTab("ROLES")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "ROLES"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <UserCog size={18} /> {t("roles")}
          </button>
        )}
        <button
          onClick={() => setActiveTab("CONFIG")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "CONFIG"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Settings2 size={18} /> {t("configuration")}
        </button>
      </div>

      <div className="space-y-8">
        {activeTab === "PROFILE" && currentUser && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
            <ProfileCard user={currentUser} onUpdate={onProfileUpdate} t={t} />
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-800 border-b pb-2">
                <Shield className="text-red-500" size={20} /> {t("security")}
              </h3>
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                <div>
                  <h4 className="font-bold text-gray-800">
                    {t("changePassword")}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {t("changePasswordDesc")}
                  </p>
                </div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition-colors"
                >
                  <KeyRound size={16} /> {t("changePassword")}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "COMPANY" && isAdmin && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <CompanyCard
              settings={companySettings}
              onUpdate={onCompanyUpdate}
              t={t}
            />
          </div>
        )}

        {activeTab === "USERS" && isAdmin && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[500px]">
              <div className="flex justify-between items-center mb-6 border-b pb-2">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                  <Users className="text-orange-500" size={20} />{" "}
                  {t("manageUsers")}
                </h3>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <UserPlus size={16} /> {t("addUser")}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {allUsers.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    currentUser={currentUser}
                    roles={roles}
                    t={t}
                    onUpdateRole={updateUserRole}
                    onToggleStatus={toggleUserStatus}
                    onUpdateBio={updateUserBio}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "ROLES" && isAdmin && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <UserCog className="text-purple-500" size={20} />{" "}
                  {t("manageRoles")}
                </h3>
                <Button
                  onClick={() => setShowAddRoleModal(true)}
                  icon={<Plus size={16} />}
                >
                  {t("createRole")}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow bg-white flex flex-col justify-between h-full group"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-900 text-lg">
                          {role.name}
                        </h4>
                        {role.isSystem && (
                          <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                            System
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-4 h-8 line-clamp-2">
                        {role.description || "Custom defined role"}
                      </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => setEditPermissionsRole(role)}
                        className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1 text-xs font-bold"
                        title="Manage Permissions"
                      >
                        <ShieldCheck size={16} /> Permissions
                      </button>
                      {role.name !== "ADMIN" && (
                        <button
                          onClick={(e) => openRenameModal(role, e)}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                          title={t("renameRole")}
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {!role.isSystem && (
                        <button
                          onClick={() => setDeleteRoleId(role.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title={t("delete")}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "CONFIG" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-800 border-b pb-2">
                <Globe className="text-green-500" size={20} />{" "}
                {t("localization")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("language")}
                  </label>
                  <select
                    value={currentUser?.language || "ES"}
                    onChange={(e) =>
                      handleLanguageChange(e.target.value as "EN" | "ES")
                    }
                    className="w-full p-2 border rounded-lg bg-white text-black"
                  >
                    <option value="EN">English (EN)</option>
                    <option value="ES">Español (ES)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
              {/* ... Password Reset Content (same as before) ... */}
              <div className="flex flex-col items-center text-center">
                <div className="bg-blue-100 p-3 rounded-full mb-4">
                  <KeyRound className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {t("changePassword")}
                </h3>

                {resetStep === 1 ? (
                  <div className="w-full">
                    <p className="text-gray-500 mb-6 text-sm">
                      {t("changePasswordDesc")}
                    </p>
                    <button
                      onClick={initiatePasswordReset}
                      disabled={isResetLoading}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex justify-center items-center gap-2"
                    >
                      {isResetLoading && (
                        <Loader2 className="animate-spin" size={16} />
                      )}{" "}
                      {t("sendCode")}
                    </button>
                  </div>
                ) : (
                  <div className="w-full space-y-4">
                    <p className="text-green-600 text-xs font-semibold bg-green-50 p-2 rounded">
                      {t("codeSentDesc")}
                    </p>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full p-2 border rounded-lg outline-none text-center tracking-widest bg-white text-black"
                      placeholder="000000"
                      maxLength={6}
                    />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-2 border rounded-lg outline-none bg-white text-black"
                      placeholder="New Password"
                    />
                    <button
                      onClick={finalizePasswordReset}
                      disabled={
                        isResetLoading ||
                        verificationCode.length !== 6 ||
                        newPassword.length < 3
                      }
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                      {isResetLoading && (
                        <Loader2 className="animate-spin" size={16} />
                      )}{" "}
                      {t("verifyAndSave")}
                    </button>
                  </div>
                )}
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setResetStep(1);
                  }}
                  className="mt-4 text-sm text-gray-400 hover:text-gray-600"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
              {/* ... Add User Modal Content ... */}
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="text-blue-500" size={20} />{" "}
                {t("sendInvitation")}
              </h3>
              <form onSubmit={handleAddUser} className="space-y-4">
                <input
                  type="text"
                  value={newUserForm.name}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, name: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg bg-white text-black"
                  placeholder={t("fullName")}
                  required
                />
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, email: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg bg-white text-black"
                  placeholder={t("email")}
                  required
                />
                <select
                  value={newUserForm.role}
                  onChange={(e) =>
                    setNewUserForm({
                      ...newUserForm,
                      role: e.target.value as UserRole,
                    })
                  }
                  className="w-full p-2 border rounded-lg bg-white text-black"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="flex-1 px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={isUserActionLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex justify-center items-center gap-2"
                  >
                    {isUserActionLoading && (
                      <Loader2 className="animate-spin" size={16} />
                    )}{" "}
                    {t("sendInvitation")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ... Other Modals (Role Create, Rename, Delete, Invitation Code, Status) are same as before, just render logic ... */}
        <Modal
          isOpen={showAddRoleModal}
          onClose={() => setShowAddRoleModal(false)}
          title={t("createRole")}
        >
          <form onSubmit={handleCreateRole} className="space-y-4">
            <Input
              label={t("roleName")}
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value.toUpperCase())}
              placeholder="e.g. MANAGER"
              required
            />
            <div className="flex gap-3 mt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAddRoleModal(false)}
                className="flex-1"
              >
                {t("cancel")}
              </Button>
              <Button type="submit" className="flex-1">
                {t("save")}
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={!!editingRoleNameId}
          onClose={() => setEditingRoleNameId(null)}
          title={t("renameRole")}
        >
          <form onSubmit={handleRenameRole} className="space-y-4">
            <Input
              label={t("roleName")}
              value={tempRoleName}
              onChange={(e) => setTempRoleName(e.target.value.toUpperCase())}
              required
            />
            <div className="flex gap-3 mt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingRoleNameId(null)}
                className="flex-1"
              >
                {t("cancel")}
              </Button>
              <Button type="submit" className="flex-1">
                {t("updateName")}
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={!!editPermissionsRole}
          onClose={() => setEditPermissionsRole(null)}
          title={`${t("manageRoles")} - ${editPermissionsRole?.name}`}
          maxWidth="max-w-4xl"
        >
          <div className="h-[600px] overflow-hidden -m-6 rounded-b-xl">
            {editPermissionsRole && (
              <RoleEditor
                role={editPermissionsRole}
                onSave={handleUpdateRolePermissions}
                t={t}
              />
            )}
          </div>
        </Modal>

        <ConfirmationModal
          isOpen={!!deleteRoleId}
          onClose={() => setDeleteRoleId(null)}
          onConfirm={confirmDeleteRole}
          title={t("confirmDelete")}
          message={t("roleDeleteConfirm")}
          confirmText={t("confirmDelete")}
          cancelText={t("cancel")}
        />

        {invitationCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full animate-in fade-in zoom-in duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="bg-green-100 p-3 rounded-full mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {t("invitationSent")}
                </h3>
                <p className="text-gray-500 mb-6 text-sm">
                  {t("invitationDesc")}
                </p>
                <div className="w-full bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300 mb-6 flex justify-center items-center">
                  <span className="text-3xl font-mono font-bold text-gray-800 tracking-widest">
                    {invitationCode}
                  </span>
                </div>
                <div className="flex w-full gap-3">
                  <button
                    onClick={() => setInvitationCode(null)}
                    className="flex-1 px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    {t("close")}
                  </button>
                  <button
                    onClick={handleCopyCode}
                    className={`flex-1 px-4 py-2 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                      copySuccess
                        ? "bg-green-600"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {copySuccess ? <Check size={16} /> : <Copy size={16} />}{" "}
                    {copySuccess ? t("copied") : t("copyLink")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <StatusModal
          isOpen={statusModal.open}
          onClose={() => setStatusModal((prev) => ({ ...prev, open: false }))}
          type={statusModal.type}
          message={statusModal.message}
          closeText={t("close")}
        />
      </div>
    </div>
  );
};
