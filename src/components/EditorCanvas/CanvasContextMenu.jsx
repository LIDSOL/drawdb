import { useEffect, useRef } from "react";
import { IconUndo, IconRedo } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../hooks";
import { IconAddTable, IconAddArea, IconAddNote } from "../../icons";

export default function CanvasContextMenu({
  visible,
  x,
  y,
  onClose,
  onAddTable,
  onAddNote,
  onAddArea,
  onUndo,
  onRedo,
  onStartAreaSelection,
  undoStack,
  redoStack,
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
      label: t("add_table"),
      icon: <IconAddTable />,
      onClick: () => {
        onAddTable();
        onClose();
      },
    },
    {
      label: t("add_area"),
      icon: <IconAddArea />,
      onClick: () => {
        onAddArea();
        onClose();
      },
    },
    {
      label: t("add_note"),
      icon: <IconAddNote />,
      onClick: () => {
        onAddNote();
        onClose();
      },
    },
    {
      type: "divider",
    },
    {
      label: t("undo"),
      icon: <IconUndo />,
      onClick: () => {
        onUndo();
        onClose();
      },
      disabled: undoStack.length === 0,
    },
    {
      label: t("redo"),
      icon: <IconRedo />,
      onClick: () => {
        onRedo();
        onClose();
      },
      disabled: redoStack.length === 0,
    },
    {
      type: "divider",
    },
    {
      label: "Area Selection",
      icon: <IconAddArea />, // Using area icon as placeholder for now
      onClick: () => {
        onStartAreaSelection();
        onClose();
      },
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
      {menuItems.map((item, index) => {
        if (item.type === "divider") {
          return (
            <div
              key={index}
              className={`my-1 border-t ${
                settings.mode === "light"
                  ? "border-gray-200"
                  : "border-zinc-600"
              }`}
            />
          );
        }

        return (
          <button
            key={index}
            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
              item.disabled
                ? "text-gray-400 cursor-not-allowed"
                : item.danger
                  ? "text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  : settings.mode === "light"
                    ? "text-gray-700 hover:bg-gray-100"
                    : "text-gray-200 hover:bg-zinc-700"
            }`}
            onClick={item.disabled ? undefined : item.onClick}
            disabled={item.disabled}
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
