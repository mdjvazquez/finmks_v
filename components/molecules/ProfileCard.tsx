import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { Save, Edit2, Upload, Phone, Mail, Briefcase } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { ConfirmationModal } from './ConfirmationModal';

interface ProfileCardProps {
  user: User;
  onUpdate: (data: Partial<User>) => Promise<void>;
  t: (key: string) => string;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ user, onUpdate, t }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    bio: user.bio || '',
    avatar: user.avatar || ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      bio: user.bio || '',
      avatar: user.avatar || ''
    });
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveClick = () => {
    setShowConfirm(true);
  };

  const confirmSave = async () => {
    await onUpdate(formData);
    setIsEditing(false);
    setShowConfirm(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-2xl mx-auto">
      {/* Header / Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-32 relative">
        <div className="absolute top-4 right-4">
            {!isEditing ? (
                 <Button 
                    variant="ghost" 
                    className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-md border-0" 
                    onClick={() => setIsEditing(true)}
                 >
                    <Edit2 size={16} /> {t('editProfile')}
                 </Button>
            ) : (
                 <div className="flex gap-2">
                     <Button 
                        variant="secondary" 
                        className="bg-white/80 backdrop-blur text-gray-700 border-0" 
                        onClick={() => { setIsEditing(false); setFormData({ name: user.name, phone: user.phone || '', bio: user.bio || '', avatar: user.avatar }); }}
                     >
                        {t('cancel')}
                     </Button>
                     <Button 
                        variant="success" 
                        onClick={handleSaveClick}
                        className="shadow-lg"
                     >
                        <Save size={16} /> {t('save')}
                     </Button>
                 </div>
            )}
        </div>
      </div>

      <div className="px-8 pb-8">
        {/* Avatar Section */}
        <div className="relative -mt-16 mb-6 flex flex-col items-center">
             <div className="relative group">
                <img 
                    src={formData.avatar || 'https://via.placeholder.com/150'} 
                    alt="Profile" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md bg-gray-100"
                />
                {isEditing && (
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Upload size={24} />
                    </button>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*"
                />
             </div>
             
             <div className="text-center mt-3">
                 {isEditing ? (
                     <input 
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="text-2xl font-bold text-center border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent"
                     />
                 ) : (
                     <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                 )}
                 <div className="flex items-center justify-center gap-2 mt-1">
                    <Badge variant={user.role === UserRole.ADMIN ? 'info' : 'neutral'}>{user.role}</Badge>
                 </div>
             </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-4 max-w-lg mx-auto">
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-white rounded-full text-gray-400 shadow-sm">
                    <Mail size={18} />
                </div>
                <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{t('email')}</p>
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-white rounded-full text-gray-400 shadow-sm">
                    <Phone size={18} />
                </div>
                <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{t('phone')}</p>
                    {isEditing ? (
                        <input 
                            type="text" 
                            value={formData.phone} 
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none text-sm font-medium"
                        />
                    ) : (
                        <p className="text-sm font-medium text-gray-900">{user.phone || '-'}</p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-white rounded-full text-gray-400 shadow-sm">
                    <Briefcase size={18} />
                </div>
                <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{t('bio')}</p>
                    {isEditing ? (
                        <input 
                            type="text" 
                            value={formData.bio} 
                            onChange={e => setFormData({...formData, bio: e.target.value})}
                            className="w-full bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none text-sm font-medium"
                        />
                    ) : (
                        <p className="text-sm font-medium text-gray-900">{user.bio || '-'}</p>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmSave}
        title={t('confirmUpdate')}
        message={t('confirmUpdateMsg')}
        confirmText={t('confirm')}
        cancelText={t('cancel')}
      />

    </div>
  );
};
