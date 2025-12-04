import React, { useState, useEffect } from "react";
import { AppRole, PermissionModule } from "../../types";
import { APP_PERMISSIONS } from "../../constants";
import { Button } from "../atoms/Button";
import { Save, ChevronDown, ChevronRight, Info, Layers } from "lucide-react";

interface RoleEditorProps {
  role: AppRole;
  onSave: (id: string, updates: { permissions: string[] }) => Promise<void>;
  t: (key: string) => string;
}

export const RoleEditor: React.FC<RoleEditorProps> = ({ role, onSave, t }) => {
  const [permissions, setPermissions] = useState<string[]>(
    role.permissions || []
  );
  const [openModules, setOpenModules] = useState<Set<string>>(
    new Set(APP_PERMISSIONS.map((m) => m.module))
  );
  const [loading, setLoading] = useState(false);

  // Sync state if role prop changes
  useEffect(() => {
    setPermissions(role.permissions || []);
  }, [role]);

  const toggleModule = (module: string) => {
    const newOpen = new Set(openModules);
    if (newOpen.has(module)) newOpen.delete(module);
    else newOpen.add(module);
    setOpenModules(newOpen);
  };

  const handlePermissionChange = (permKey: string) => {
    if (role.name === "ADMIN") return;

    setPermissions((prev) => {
      if (prev.includes(permKey)) return prev.filter((p) => p !== permKey);
      return [...prev, permKey];
    });
  };

  // Helper: Get all permission keys within a module (recursive)
  const getModulePermissions = (mod: PermissionModule): string[] => {
    let perms: string[] = [];
    if (mod.actions)
      perms = [...perms, ...mod.actions.map((a) => `${mod.module}.${a}`)];
    if (mod.children)
      mod.children.forEach(
        (child) => (perms = [...perms, ...getModulePermissions(child)])
      );
    return perms;
  };

  // Toggle Entire Group (Select All / Deselect All)
  const handleToggleGroup = (group: PermissionModule, e: React.MouseEvent) => {
    e.stopPropagation();
    if (role.name === "ADMIN") return;

    const groupPerms = getModulePermissions(group);
    const isAllSelected = groupPerms.every((p) => permissions.includes(p));

    if (isAllSelected) {
      // Deselect all
      setPermissions((prev) => prev.filter((p) => !groupPerms.includes(p)));
    } else {
      // Select all unique permissions
      setPermissions((prev) => [...new Set([...prev, ...groupPerms])]);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    await onSave(role.id, { permissions });
    setLoading(false);
  };

  const isSuperAdmin = role.name === "ADMIN";

  // Toggle Switch Component
  const ToggleSwitch = ({
    checked,
    onChange,
    disabled,
  }: {
    checked: boolean;
    onChange: () => void;
    disabled: boolean;
  }) => (
    <div
      onClick={() => !disabled && onChange()}
      className={`w-9 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
        checked ? "bg-blue-600" : "bg-gray-300"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <div
        className={`bg-white w-3 h-3 rounded-full shadow-md transform duration-300 ease-in-out ${
          checked ? "translate-x-4" : ""
        }`}
      />
    </div>
  );

  // Recursive Render Function
  const renderPermissionModule = (
    moduleGroup: PermissionModule,
    level: number = 0
  ) => {
    const isOpen = openModules.has(moduleGroup.module);
    const isOrganism = !!moduleGroup.children;

    const allGroupPerms = getModulePermissions(moduleGroup);
    const allSelected =
      allGroupPerms.length > 0 &&
      allGroupPerms.every((p) => isSuperAdmin || permissions.includes(p));

    return (
      <div
        key={moduleGroup.module}
        className={`border border-gray-100 rounded-lg mb-3 overflow-hidden ${
          level > 0 ? "ml-6 border-l-4 border-l-blue-50" : "shadow-sm"
        }`}
      >
        <div
          className={`w-full flex items-center justify-between p-3 transition-colors cursor-pointer select-none ${
            isOrganism ? "bg-gray-50" : "bg-white hover:bg-gray-50"
          }`}
          onClick={() => toggleModule(moduleGroup.module)}
        >
          <div className="flex items-center gap-2 font-semibold text-sm text-gray-800">
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            {isOrganism && <Layers size={16} className="text-blue-500" />}
            <span>{t(`perm_${moduleGroup.module}`)}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Master Toggle for Group */}
            {!isSuperAdmin && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2"
              >
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                  {allSelected ? t("deselectAll") : t("selectAll")}
                </span>
                <ToggleSwitch
                  checked={allSelected}
                  onChange={() =>
                    handleToggleGroup(moduleGroup, {} as React.MouseEvent)
                  } // Fake event since logic handles stopPropagation
                  disabled={isSuperAdmin}
                />
              </div>
            )}
          </div>
        </div>

        {isOpen && (
          <div
            className={`bg-white border-t border-gray-100 ${
              isOrganism ? "p-4" : "p-3"
            }`}
          >
            {/* Render Actions (Leaf permissions) */}
            {moduleGroup.actions && moduleGroup.actions.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {moduleGroup.actions.map((action) => {
                  const permKey = `${moduleGroup.module}.${action}`;
                  const isChecked =
                    isSuperAdmin || permissions.includes(permKey);

                  return (
                    <div
                      key={permKey}
                      className="flex items-center justify-between p-2 rounded border border-gray-100 hover:bg-blue-50 transition-colors"
                    >
                      <span className="text-sm text-gray-700 font-medium">
                        {t(`perm_${action}`)}
                      </span>
                      <ToggleSwitch
                        checked={isChecked}
                        onChange={() => handlePermissionChange(permKey)}
                        disabled={isSuperAdmin}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Render Children (Sub-modules) */}
            {moduleGroup.children && (
              <div className="space-y-3">
                {moduleGroup.children.map((child) =>
                  renderPermissionModule(child, level + 1)
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col h-full shadow-sm">
      {/* Header */}
      <div
        className={`p-5 border-b border-gray-200 ${
          isSuperAdmin ? "bg-purple-50" : "bg-gray-50"
        }`}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-gray-800">{role.name}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {role.description || "Custom Role"}
            </p>
          </div>
          {!isSuperAdmin && (
            <Button
              onClick={handleSave}
              isLoading={loading}
              icon={<Save size={16} />}
              className="text-xs px-4 h-9"
            >
              {t("save")}
            </Button>
          )}
        </div>
        {isSuperAdmin && (
          <div className="mt-3 flex items-center gap-2 text-xs text-purple-700 bg-purple-100 p-2.5 rounded-lg border border-purple-200">
            <Info size={14} />
            <span className="font-medium">
              Admin roles have full system access. Permissions cannot be
              modified.
            </span>
          </div>
        )}
      </div>

      {/* Permissions Tree */}
      <div className="flex-1 overflow-y-auto p-5 bg-gray-50/50">
        {APP_PERMISSIONS.map((moduleGroup) =>
          renderPermissionModule(moduleGroup)
        )}
      </div>
    </div>
  );
};
