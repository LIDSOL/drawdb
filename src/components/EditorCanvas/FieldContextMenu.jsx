import React, { useEffect, useRef } from "react";
import {
  IconEdit,
  IconDeleteStroked,
  IconKeyStroked,
  IconEdit2Stroked,
  IconCheckboxTick,
  IconMinus,
  IconPlus,
} from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../hooks";

export default function FieldContextMenu({
  visible,
  x,
  y,
  field,
  onClose,
  onEdit,
  onDelete,
  onTogglePrimaryKey,
  onToggleNotNull,
  onToggleUnique,
  onToggleAutoIncrement,
}) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const menuRef = useRef();

  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("contextmenu", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("contextmenu", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  const menuItems = [
    {
      label: t("edit") || "Edit Field",
      icon: <IconEdit />,
      onClick: () => {
        onEdit();
        onClose();
      },
    },
    {
      label: field?.primary ? "Remove Primary Key" : "Set as Primary Key",
      icon: <IconKeyStroked />,
      onClick: () => {
        onTogglePrimaryKey();
        onClose();
      },
    },
    {
      label: field?.notNull ? "Allow NULL" : "Set NOT NULL",
      icon: field?.notNull ? <IconMinus /> : <IconCheckboxTick />,
      onClick: () => {
        onToggleNotNull();
        onClose();
      },
    },
    {
      label: field?.unique ? "Remove Unique" : "Set Unique",
      icon: field?.unique ? <IconMinus /> : <IconCheckboxTick />,
      onClick: () => {
        onToggleUnique();
        onClose();
      },
    },
    {
      label: field?.increment
        ? "Disable Auto Increment"
        : "Enable Auto Increment",
      icon: field?.increment ? <IconMinus /> : <IconCheckboxTick />,
      onClick: () => {
        onToggleAutoIncrement();
        onClose();
      },
    },
    {
      type: "divider",
    },
    {
      label: t("delete") || "Delete Field",
      icon: <IconDeleteStroked />,
      onClick: () => {
        onDelete();
        onClose();
      },
      danger: true,
    },
  ];

  return (
    <div
      ref={menuRef}
      className={`fixed z-50 rounded-lg shadow-lg py-1 min-w-[160px] ${
        settings.mode === "light"
          ? "bg-white border border-gray-200"
          : "bg-zinc-800 border border-zinc-600"
      }`}
      style={{
        left: x,
        top: y,
      }}
    >
      {menuItems.map((item, index) => {
        if (item.type === "divider") {
          return (
            <div
              key={index}
              className={`h-px my-1 ${
                settings.mode === "light" ? "bg-gray-200" : "bg-zinc-600"
              }`}
            />
          );
        }

        return (
          <button
            key={index}
            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
              item.danger
                ? "text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                : settings.mode === "light"
                  ? "text-gray-700 hover:bg-gray-100"
                  : "text-gray-200 hover:bg-zinc-700"
            }`}
            onClick={item.onClick}
          >
            <span className="w-4 h-4 flex items-center justify-center">
              {item.icon}
            </span>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
