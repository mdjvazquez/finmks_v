
import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinancialContext';
import { UserRole } from '../types';
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';
import { Logo } from '../components/atoms/Logo';
import { APP_NAME } from '../constants';

export const Login: React.FC = () => {
  const { login, signUp, verifyInvitation, t } = useFinance();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Invitation Logic
  const [showInvitationInput, setShowInvitationInput] = useState(false);
  const [invitationCode, setInvitationCode] = useState('');
  const [invitedName, setInvitedName] = useState('');
  const [invitedRole, setInvitedRole] = useState<UserRole | null>(null);

  const handleVerifyCode = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError('');
      
      const { success, data, error: verifyError } = await verifyInvitation(invitationCode);
      setIsLoading(false);

      if (success && data) {
          setIsSignUp(true);
          setShowInvitationInput(false);
          setEmail(data.email);
          setInvitedName(data.name);
          setInvitedRole(data.role as UserRole);
          setError(t('codeVerified')); // Positive feedback
      } else {
          setError(verifyError || t('codeInvalid'));
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
        if (isSignUp) {
            const { success, error: signUpError } = await signUp(email, password, invitedName, invitedRole || undefined, invitationCode);
            if (!success) {
                setError(signUpError || 'Signup failed');
            } else {
                setError('Check your email for confirmation!');
                setIsSignUp(false);
                setInvitationCode(''); // Clear code after successful use
            }
        } else {
            const { success, error: loginError } = await login(email, password);
            if (!success) {
                setError(loginError || t('invalidCredentials'));
            }
        }
    } catch (err) {
        setError('An unexpected error occurred.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-slate-900 p-8 text-center relative">
          {showInvitationInput && (
              <button 
                onClick={() => { setShowInvitationInput(false); setError(''); }}
                className="absolute left-4 top-4 text-white hover:text-gray-300"
              >
                  <ArrowLeft size={20}/>
              </button>
          )}
          
          <div className="flex flex-col items-center justify-center mb-6">
             <div className="bg-white/10 w-20 h-20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-inner border border-white/10">
                 <Logo className="w-12 h-12 text-blue-400" />
             </div>
             <h2 className="text-3xl font-extrabold text-white mt-4 tracking-tight">{APP_NAME}</h2>
          </div>

          <h1 className="text-xl font-medium text-blue-100">
              {showInvitationInput ? t('verifyCode') : isSignUp ? 'Create Account' : t('welcomeBack')}
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
              {showInvitationInput ? 'Enter the code provided by your admin.' : t('signInTo')}
          </p>
        </div>
        
        <div className="p-8">
          
          {error && (
                <div className={`text-sm p-3 rounded-lg flex items-center gap-2 mb-4 border ${(error.includes('Verified') || error.includes('Verificado') || error.includes('Check')) ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    <AlertCircle size={16} />
                    {error}
                </div>
          )}

          {/* VIEW: VERIFY INVITATION */}
          {showInvitationInput ? (
              <form onSubmit={handleVerifyCode} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('enterCode')}</label>
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            required
                            value={invitationCode}
                            onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black transition-all tracking-widest font-mono uppercase"
                            placeholder="XXXX"
                            maxLength={4}
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={isLoading || invitationCode.length !== 4}
                    className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : t('verifyCode')}
                </button>
              </form>
          ) : (
            /* VIEW: LOGIN / SIGNUP */
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="email" 
                            required
                            disabled={isSignUp} // Email is locked if signing up via invite
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black transition-all disabled:bg-gray-100"
                            placeholder="you@example.com"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black transition-all"
                            placeholder={t('passwordPlaceholder')}
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isSignUp ? 'Sign Up' : t('loginButton'))}
                </button>

                {!isSignUp && (
                    <div className="text-center pt-2">
                         <button 
                            type="button"
                            onClick={() => setShowInvitationInput(true)}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            {t('haveCode')}
                        </button>
                    </div>
                )}
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
