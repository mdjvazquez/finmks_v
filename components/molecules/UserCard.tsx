import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { Power, Save } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

interface UserCardProps {
  user: User;
  currentUser: User | null;
  t: (key: string) => string;
  onUpdateRole: (userId: string, newRole: UserRole) => void;
  onToggleStatus: (userId: string, currentStatus: string) => void;
  onUpdateBio: (userId: string, bio: string) => Promise<{success: boolean, error?: string}>;
}

export const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  currentUser, 
  t, 
  onUpdateRole, 
  onToggleStatus,
  onUpdateBio
}) => {
  const isCurrentUser = user.id === currentUser?.id;
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  
  const [bio, setBio] = useState(user.bio || '');
  const [pendingAction, setPendingAction] = useState<{
      type: 'ROLE' | 'STATUS' | 'BIO';
      payload?: any;
  } | null>(null);

  useEffect(() => {
      setBio(user.bio || '');
  }, [user.bio]);

  const handleRoleChange = (newRole: string) => {
      setPendingAction({ type: 'ROLE', payload: newRole });
  };

  const handleStatusToggle = () => {
      setPendingAction({ type: 'STATUS' });
  };

  const handleBioSave = () => {
      if (bio !== user.bio) {
          setPendingAction({ type: 'BIO' });
      }
  };

  const confirmAction = async () => {
      if (!pendingAction) return;

      if (pendingAction.type === 'ROLE') {
          onUpdateRole(user.id, pendingAction.payload as UserRole);
      } else if (pendingAction.type === 'STATUS') {
          onToggleStatus(user.id, user.status || 'ACTIVE');
      } else if (pendingAction.type === 'BIO') {
          await onUpdateBio(user.id, bio);
      }
      setPendingAction(null);
  };

  return (
    <>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full group">
        <div className="flex items-start gap-4 mb-3">
            <div className="flex-shrink-0">
            {user.avatar ? (
                <img 
                src={user.avatar} 
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" 
                alt={user.name} 
                />
            ) : (
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-500 border-2 border-white shadow-sm">
                {user.name.charAt(0)}
                </div>
            )}
            </div>
            <div className="overflow-hidden flex-1">
            <p className="font-semibold text-gray-900 truncate flex items-center gap-2">
                {user.name} 
                {isCurrentUser && (
                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                    You
                </span>
                )}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
        </div>

        {/* Bio / Position Field */}
        <div className="mb-4">
            <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-wider block">
                {t('bio')}
            </label>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={!isAdmin}
                    className="w-full text-xs p-1.5 border border-gray-200 rounded bg-gray-50 text-gray-700 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    placeholder="Position / Bio"
                />
                {isAdmin && bio !== user.bio && (
                    <button 
                        onClick={handleBioSave}
                        className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                        title={t('save')}
                    >
                        <Save size={16} />
                    </button>
                )}
            </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2 mt-auto">
            {/* Role Select */}
            <div className="flex flex-col">
            <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-wider">
                {t('role')}
            </label>
            <select
                value={user.role}
                disabled={isCurrentUser || !isAdmin}
                onChange={(e) => handleRoleChange(e.target.value)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none shadow-sm ${
                user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' :
                user.role === UserRole.ACCOUNTANT ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                'bg-gray-100 text-gray-800 hover:bg-gray-200'
                } ${isCurrentUser || !isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
                {Object.values(UserRole).map(role => (
                <option key={role} value={role}>{role}</option>
                ))}
            </select>
            </div>

            {/* Status Toggle */}
            <div className="flex flex-col items-end">
            <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-wider">
                {t('status')}
            </label>
            <button
                onClick={handleStatusToggle}
                disabled={isCurrentUser || !isAdmin}
                title={isCurrentUser ? 'Cannot modify own status' : (user.status === 'ACTIVE' ? t('deactivate') : t('activate'))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border ${
                isCurrentUser || !isAdmin
                ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'
                : (user.status === 'ACTIVE'
                    ? 'bg-white text-green-700 border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200')
                }`}
            >
                <Power size={14} className={user.status === 'ACTIVE' ? "text-green-500" : "text-red-500"} />
                {user.status === 'ACTIVE' ? t('active') : t('inactive')}
            </button>
            </div>
        </div>
        </div>

        {/* Confirmation Modal */}
        <ConfirmationModal
            isOpen={!!pendingAction}
            onClose={() => setPendingAction(null)}
            onConfirm={confirmAction}
            title={t('confirmUpdate')}
            message={
                (pendingAction?.type === 'ROLE' ? t('confirmRoleMsg') : '') ||
                (pendingAction?.type === 'STATUS' ? t('confirmStatusMsg') : '') ||
                (pendingAction?.type === 'BIO' ? t('confirmUpdateMsg') : '')
            }
            confirmText={t('confirm')}
            cancelText={t('cancel')}
        />
    </>
  );
};
