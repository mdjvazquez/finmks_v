import React, { useState, useRef, useEffect } from "react";
import { CompanySettings } from "../../types";
import {
  Save,
  Edit2,
  Upload,
  Building2,
  CreditCard,
  MapPin,
  Percent,
} from "lucide-react";
import { Button } from "../atoms/Button";
import { ConfirmationModal } from "./ConfirmationModal";

interface CompanyCardProps {
  settings: CompanySettings;
  onUpdate: (settings: CompanySettings) => Promise<void>;
  t: (key: string) => string;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({
  settings,
  onUpdate,
  t,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState(settings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, logoUrl: reader.result as string }));
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-4xl mx-auto">
      {/* Header / Banner */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 h-32 relative">
        <div className="absolute top-4 right-4">
          {!isEditing ? (
            <Button
              variant="ghost"
              className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-md border-0"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 size={16} /> {t("editCompany")}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="bg-white/80 backdrop-blur text-gray-700 border-0"
                onClick={() => {
                  setIsEditing(false);
                  setFormData(settings);
                }}
              >
                {t("cancel")}
              </Button>
              <Button
                variant="success"
                onClick={handleSaveClick}
                className="shadow-lg"
              >
                <Save size={16} /> {t("save")}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="px-8 pb-8">
        {/* Logo Section */}
        <div className="relative -mt-16 mb-6 flex flex-col items-center">
          <div className="relative group">
            {formData.logoUrl ? (
              <img
                src={formData.logoUrl}
                alt="Company Logo"
                className="w-32 h-32 rounded-lg object-contain border-4 border-white shadow-md bg-white p-2"
              />
            ) : (
              <div className="w-32 h-32 rounded-lg border-4 border-white shadow-md bg-white flex items-center justify-center text-gray-400">
                <Building2 size={40} />
              </div>
            )}

            {isEditing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
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

          <div className="text-center mt-3 w-full max-w-md">
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="text-2xl font-bold text-center border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent w-full"
                placeholder="Company Name"
              />
            ) : (
              <h2 className="text-2xl font-bold text-gray-900">
                {settings.name}
              </h2>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {/* Tax ID */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="p-2 bg-white rounded-full text-gray-400 shadow-sm">
              <CreditCard size={18} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                {t("taxId")}
              </p>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) =>
                    setFormData({ ...formData, taxId: e.target.value })
                  }
                  className="w-full bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none text-sm font-medium"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900">
                  {settings.taxId}
                </p>
              )}
            </div>
          </div>

          {/* Tax Rate */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="p-2 bg-white rounded-full text-gray-400 shadow-sm">
              <Percent size={18} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                {t("taxRate")}
              </p>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.taxRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      taxRate: Number(e.target.value),
                    })
                  }
                  className="w-full bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none text-sm font-medium"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900">
                  {settings.taxRate}%
                </p>
              )}
              <p className="text-[10px] text-gray-400 mt-1">
                {t("taxRateDesc")}
              </p>
            </div>
          </div>

          {/* Address - Spans 2 cols */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg md:col-span-2">
            <div className="p-2 bg-white rounded-full text-gray-400 shadow-sm">
              <MapPin size={18} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                {t("businessAddress")}
              </p>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none text-sm font-medium"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900">
                  {settings.address}
                </p>
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
        title={t("confirmUpdate")}
        message={t("confirmUpdateMsg")}
        confirmText={t("confirm")}
        cancelText={t("cancel")}
      />
    </div>
  );
};
