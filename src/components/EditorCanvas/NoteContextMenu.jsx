import { useEffect, useRef } from "react";
import {
  IconEdit,
  IconDeleteStroked,
  IconEdit2Stroked,
  IconComment,
} from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../hooks";

export default function NoteContextMenu({
  visible,
  x,
  y,
  onClose,
  onEdit,
  onDelete,
  onRename,
  onEditContent,
  onChangeColor,
}) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const menuRef = useRef();

  useEffect(() => {
    if (!visible) return;

    const currentMenuRef = menuRef.current;

    const handleClickOutside = (e) => {
      if (currentMenuRef && !currentMenuRef.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleMouseLeave = () => {
      onClose();
    };

    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("keydown", handleEscape);

      // Add mouse leave event to the menu element
      if (currentMenuRef) {
        currentMenuRef.addEventListener("mouseleave", handleMouseLeave);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);

      // Clean up mouse leave event
      if (currentMenuRef) {
        currentMenuRef.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [visible, onClose]);

  if (!visible) return null;

  const menuItems = [
    {
      label: t("edit"),
      icon: <IconEdit />,
      onClick: () => {
        onEdit();
        onClose();
      },
    },
    {
      label: t("rename"),
      icon: <IconEdit2Stroked />,
      onClick: () => {
        onRename();
        onClose();
      },
    },
    {
      label: "Edit Content",
      icon: <IconComment />,
      onClick: () => {
        onEditContent();
        onClose();
      },
    },
    {
      label: "Change Color",
      icon: <IconEdit2Stroked />,
      onClick: () => {
        onChangeColor();
        onClose();
      },
    },
    {
      label: t("delete"),
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
      className={`fixed z-50 rounded-lg shadow-lg py-1 min-w-[140px] ${
        settings.mode === "light"
          ? "bg-white border border-gray-200"
          : "bg-zinc-800 border border-zinc-600"
      }`}
      style={{
        left: x,
        top: y,
      }}
    >
      {menuItems.map((item, index) => (
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
      ))}
    </div>
  );
}
