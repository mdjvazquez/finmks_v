import React, { useState, useRef, useEffect } from "react";
import { useFinance } from "../context/FinancialContext";
import { UserRole } from "../types";
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
  Power,
  Mail,
  Copy,
  Check,
} from "lucide-react";

export const Settings: React.FC = () => {
  const {
    companySettings,
    updateCompanySettings,
    currentUser,
    updateUserProfile,
    requestPasswordReset,
    confirmPasswordChange,
    t,
    allUsers,
    addNewUser,
    toggleUserStatus,
  } = useFinance();

  // Tab State
  const [activeTab, setActiveTab] = useState<
    "PROFILE" | "COMPANY" | "CONFIG" | "USERS"
  >("PROFILE");

  // Settings State
  const [settingsForm, setSettingsForm] = useState(companySettings);

  // User Profile State
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    bio: currentUser?.bio || "",
    avatar: currentUser?.avatar || "",
  });

  // Password Reset State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetStep, setResetStep] = useState<1 | 2>(1); // 1: Request, 2: Verify
  const [isLoading, setIsLoading] = useState(false);

  // Add User State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
  });

  // Invitation Modal State
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        bio: currentUser.bio || "",
        avatar: currentUser.avatar || "",
      });
    }
  }, [currentUser]);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings(settingsForm);
    alert(t("settingsSaved"));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(profileForm);
    alert(t("settingsSaved"));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettingsForm({ ...settingsForm, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm({ ...profileForm, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Immediate Language Change for current user
  const handleLanguageChange = (lang: "EN" | "ES") => {
    updateUserProfile({ language: lang });
  };

  // Password Reset Logic
  const initiatePasswordReset = async () => {
    setIsLoading(true);
    const code = await requestPasswordReset();
    setIsLoading(false);
    setResetStep(2);
    // Simulate email sending
    alert(`${t("codeSent")} ${t("verificationCode")}: ${code}`);
  };

  const finalizePasswordReset = async () => {
    setIsLoading(true);
    const success = await confirmPasswordChange(verificationCode, newPassword);
    setIsLoading(false);

    if (success) {
      alert(t("passwordChanged"));
      setShowPasswordModal(false);
      setVerificationCode("");
      setNewPassword("");
      setResetStep(1);
    } else {
      alert(t("invalidCode"));
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { success, code } = await addNewUser(newUserForm);
    setIsLoading(false);

    if (success && code) {
      setInvitationCode(code);
      setShowAddUserModal(false);
      setNewUserForm({ name: "", email: "" });
    } else {
      alert(t("userCreateError") + "error aqui");
    }
  };

  const handleCopyCode = () => {
    if (invitationCode) {
      navigator.clipboard.writeText(invitationCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{t("appSettings")}</h2>
        <p className="text-gray-500">{t("managePreferences")}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("PROFILE")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "PROFILE"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <UserCircle size={18} />
          {t("myProfile")}
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
            <Building2 size={18} />
            {t("companyInfo")}
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
            <Users size={18} />
            {t("users")}
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
          <Settings2 size={18} />
          {t("configuration")}
        </button>
      </div>

      <div className="space-y-8">
        {/* TAB: MY PROFILE */}
        {activeTab === "PROFILE" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
            {/* User Profile Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-800 border-b pb-2">
                <UserCircle className="text-purple-500" size={20} />{" "}
                {t("myProfile")}
              </h3>

              <form
                onSubmit={handleSaveProfile}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {/* Avatar */}
                <div className="flex flex-col items-center gap-4">
                  <img
                    src={
                      profileForm.avatar || "https://via.placeholder.com/150"
                    }
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow-sm"
                  />
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={handleAvatarUpload}
                    className="hidden"
                    accept="image/*"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {t("uploadPhoto")}
                  </button>
                </div>

                {/* Fields */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("fullName")}
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, name: e.target.value })
                      }
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("email")}
                      </label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            email: e.target.value,
                          })
                        }
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("phone")}
                      </label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            phone: e.target.value,
                          })
                        }
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("bio")}
                    </label>
                    <input
                      type="text"
                      value={profileForm.bio}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, bio: e.target.value })
                      }
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black"
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                      <Save size={16} /> {t("saveChanges")}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Security Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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

        {/* TAB: COMPANY INFO (ADMIN ONLY) */}
        {activeTab === "COMPANY" && isAdmin && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <form
              onSubmit={handleSaveCompany}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-800 border-b pb-2">
                <Building2 className="text-blue-500" size={20} />{" "}
                {t("companyInfo")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col items-center justify-center space-y-3 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  {settingsForm.logoUrl ? (
                    <img
                      src={settingsForm.logoUrl}
                      alt="Logo"
                      className="h-24 object-contain"
                    />
                  ) : (
                    <div className="h-24 w-24 flex items-center justify-center bg-gray-200 rounded-full text-gray-400 text-xs">
                      No Logo
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    className="hidden"
                    accept="image/*"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-blue-600 font-medium hover:text-blue-800"
                  >
                    {t("uploadLogo")}
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("companyName")}
                    </label>
                    <input
                      type="text"
                      value={settingsForm.name}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          name: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("taxId")}
                    </label>
                    <input
                      type="text"
                      value={settingsForm.taxId}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          taxId: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black"
                      required
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("businessAddress")}
                  </label>
                  <input
                    type="text"
                    value={settingsForm.address}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        address: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black"
                    placeholder="Street, City, State, Zip"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("taxRate")}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={settingsForm.taxRate}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          taxRate: Number(e.target.value),
                        })
                      }
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black"
                      min="0"
                      max="100"
                    />
                    <span className="absolute right-3 top-2 text-gray-400">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {t("taxRateDesc")}
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
                >
                  <Save size={20} /> {t("saveChanges")}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB: USERS (ADMIN ONLY) */}
        {activeTab === "USERS" && isAdmin && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6 border-b pb-2">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                  <Users className="text-orange-500" size={20} />{" "}
                  {t("manageUsers")}
                </h3>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <UserPlus size={16} /> {t("addUser")}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3">{t("fullName")}</th>
                      <th className="px-6 py-3">{t("email")}</th>
                      <th className="px-6 py-3">{t("role")}</th>
                      <th className="px-6 py-3">{t("status")}</th>
                      <th className="px-6 py-3">{t("actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allUsers.map((user) => {
                      const isCurrentUser = user.id === currentUser?.id;
                      return (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                className="w-8 h-8 rounded-full"
                                alt=""
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                {user.name.charAt(0)}
                              </div>
                            )}
                            {user.name}{" "}
                            {isCurrentUser && (
                              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded ml-2">
                                (You)
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {user.email}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.role === UserRole.ADMIN
                                  ? "bg-purple-100 text-purple-800"
                                  : user.role === UserRole.ACCOUNTANT
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.status === "ACTIVE"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {user.status === "ACTIVE"
                                ? t("active")
                                : t("inactive")}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() =>
                                !isCurrentUser &&
                                toggleUserStatus(
                                  user.id,
                                  user.status || "ACTIVE"
                                )
                              }
                              disabled={isCurrentUser}
                              title={
                                isCurrentUser
                                  ? "Cannot modify own status"
                                  : user.status === "ACTIVE"
                                  ? t("deactivate")
                                  : t("activate")
                              }
                              className={`p-1.5 rounded-md transition-colors ${
                                isCurrentUser
                                  ? "text-gray-300 cursor-not-allowed"
                                  : user.status === "ACTIVE"
                                  ? "text-green-600 hover:bg-red-50 hover:text-red-600"
                                  : "text-red-600 hover:bg-green-50 hover:text-green-600"
                              }`}
                            >
                              <Power size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {allUsers.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-gray-400"
                        >
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CONFIGURATION */}
        {activeTab === "CONFIG" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
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
                      disabled={isLoading}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex justify-center items-center gap-2"
                    >
                      {isLoading && (
                        <Loader2 className="animate-spin" size={16} />
                      )}
                      {t("sendCode")}
                    </button>
                  </div>
                ) : (
                  <div className="w-full space-y-4">
                    <p className="text-green-600 text-xs font-semibold bg-green-50 p-2 rounded">
                      {t("codeSentDesc")}
                    </p>
                    <div>
                      <label className="block text-left text-xs font-medium text-gray-700 mb-1">
                        {t("verificationCode")}
                      </label>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center tracking-widest bg-white text-black"
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>
                    <div>
                      <label className="block text-left text-xs font-medium text-gray-700 mb-1">
                        {t("newPassword")}
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black"
                      />
                    </div>
                    <button
                      onClick={finalizePasswordReset}
                      disabled={
                        isLoading ||
                        verificationCode.length !== 6 ||
                        newPassword.length < 3
                      }
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                      {isLoading && (
                        <Loader2 className="animate-spin" size={16} />
                      )}
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

        {/* Add User Modal */}
        {showAddUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="text-blue-500" size={20} />
                {t("sendInvitation")}
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Generate an invitation code for a new user.
              </p>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("fullName")}
                  </label>
                  <input
                    type="text"
                    value={newUserForm.name}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, name: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("email")}
                  </label>
                  <input
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, email: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black"
                    required
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex justify-center items-center gap-2"
                  >
                    {isLoading && (
                      <Loader2 className="animate-spin" size={16} />
                    )}
                    {t("sendInvitation")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Invitation Code Modal */}
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
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
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
                    {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                    {copySuccess ? t("copied") : t("copyLink")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
