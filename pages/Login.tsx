import React, { useState } from "react";
import { useFinance } from "../context/FinancialContext";
import { UserRole } from "../types";
import {
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
  Building2,
  User,
} from "lucide-react";
import { Logo } from "../components/atoms/Logo";
import { APP_NAME } from "../constants";

export const Login: React.FC = () => {
  const { login, signUp, registerCompany, verifyInvitation, t } = useFinance();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Modes: 'LOGIN' | 'VERIFY_CODE' | 'SIGNUP_INVITE' | 'REGISTER_COMPANY'
  const [mode, setMode] = useState<
    "LOGIN" | "VERIFY_CODE" | "SIGNUP_INVITE" | "REGISTER_COMPANY"
  >("LOGIN");

  // Registration Fields
  const [regName, setRegName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyTaxId, setCompanyTaxId] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");

  // Invitation Fields
  const [invitationCode, setInvitationCode] = useState("");
  const [invitedRole, setInvitedRole] = useState<string>("");

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const {
      success,
      data,
      error: verifyError,
    } = await verifyInvitation(invitationCode);
    setIsLoading(false);

    if (success && data) {
      setMode("SIGNUP_INVITE");
      setEmail(data.email);
      setRegName(data.name);
      setInvitedRole(data.role);
      setError(t("codeVerified"));
    } else {
      setError(verifyError || t("codeInvalid"));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { success, error } = await login(email, password);
    setIsLoading(false);
    if (!success) setError(error || t("invalidCredentials"));
  };

  const handleInviteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { success, error } = await signUp(
      email,
      password,
      regName,
      invitationCode
    );
    setIsLoading(false);
    if (!success) setError(error || "Signup failed");
    else {
      setError("Success! Please log in.");
      setMode("LOGIN");
    }
  };

  const handleRegisterCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { success, error } = await registerCompany(
      { email, password, name: regName },
      { name: companyName, taxId: companyTaxId, address: companyAddress }
    );
    setIsLoading(false);
    if (!success) setError(error || "Registration failed");
    else {
      setError("Company Registered! Please log in.");
      setMode("LOGIN");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-slate-900 p-8 text-center relative">
          {mode !== "LOGIN" && (
            <button
              onClick={() => {
                setMode("LOGIN");
                setError("");
                setEmail("");
                setPassword("");
              }}
              className="absolute left-4 top-4 text-white hover:text-gray-300"
            >
              <ArrowLeft size={20} />
            </button>
          )}

          <div className="flex flex-col items-center justify-center mb-6">
            <div className="bg-white/10 w-20 h-20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-inner border border-white/10">
              <Logo className="w-12 h-12 text-blue-400" />
            </div>
            <h2 className="text-3xl font-extrabold text-white mt-4 tracking-tight">
              {APP_NAME}
            </h2>
          </div>

          <h1 className="text-xl font-medium text-blue-100">
            {mode === "LOGIN"
              ? t("welcomeBack")
              : mode === "REGISTER_COMPANY"
              ? "Register New Company"
              : mode === "VERIFY_CODE"
              ? t("verifyCode")
              : "Create Account"}
          </h1>
        </div>

        <div className="p-8">
          {error && (
            <div
              className={`text-sm p-3 rounded-lg flex items-center gap-2 mb-4 border ${
                error.includes("Success") ||
                error.includes("Verified") ||
                error.includes("!") ||
                error.includes("Registered")
                  ? "bg-green-50 text-green-700 border-green-100"
                  : "bg-red-50 text-red-600 border-red-100"
              }`}
            >
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {mode === "LOGIN" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="relative">
                <Mail
                  className="absolute left-3 top-3 text-gray-400"
                  size={18}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-black"
                  placeholder={t("email")}
                />
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-3 text-gray-400"
                  size={18}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-black"
                  placeholder={t("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400"
                >
                  <Eye size={18} />
                </button>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  t("loginButton")
                )}
              </button>

              <div className="flex justify-between text-sm pt-4">
                <button
                  type="button"
                  onClick={() => setMode("VERIFY_CODE")}
                  className="text-blue-600 hover:underline"
                >
                  {t("haveCode")}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("REGISTER_COMPANY")}
                  className="text-blue-600 hover:underline"
                >
                  Register Company
                </button>
              </div>
            </form>
          )}

          {mode === "VERIFY_CODE" && (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div className="relative">
                <KeyRound
                  className="absolute left-3 top-3 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  required
                  value={invitationCode}
                  onChange={(e) =>
                    setInvitationCode(e.target.value.toUpperCase())
                  }
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-black uppercase font-mono tracking-widest"
                  placeholder="XXXX"
                  maxLength={4}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  t("verifyCode")
                )}
              </button>
            </form>
          )}

          {mode === "SIGNUP_INVITE" && (
            <form onSubmit={handleInviteSignup} className="space-y-4">
              <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-2">
                Joining as <b>{invitedRole}</b>
              </div>
              <input
                type="email"
                disabled
                value={email}
                className="w-full p-2 border rounded bg-gray-100 text-gray-500"
              />
              <input
                type="text"
                disabled
                value={regName}
                className="w-full p-2 border rounded bg-gray-100 text-gray-500"
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded bg-white text-black"
                placeholder="Create Password"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
          )}

          {mode === "REGISTER_COMPANY" && (
            <form onSubmit={handleRegisterCompany} className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <User size={14} /> User Admin
              </h3>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full p-2 text-sm border rounded bg-white text-black"
                placeholder="Full Name"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 text-sm border rounded bg-white text-black"
                placeholder="Email"
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 text-sm border rounded bg-white text-black"
                placeholder="Password"
              />

              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-4 mb-1 flex items-center gap-1">
                <Building2 size={14} /> Company Details
              </h3>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-2 text-sm border rounded bg-white text-black"
                placeholder="Company Name"
              />
              <input
                type="text"
                value={companyTaxId}
                onChange={(e) => setCompanyTaxId(e.target.value)}
                className="w-full p-2 text-sm border rounded bg-white text-black"
                placeholder="Tax ID / RFC"
              />
              <input
                type="text"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                className="w-full p-2 text-sm border rounded bg-white text-black"
                placeholder="Address"
              />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg mt-4 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Register Company"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
