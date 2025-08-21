import { useEffect, useRef, useState } from "react";
import {
  IconEdit,
  IconDeleteStroked,
  IconLoopTextStroked,
  IconChevronRight,
  IconEdit2Stroked,
  IconRefresh,
} from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../hooks";
import {
  RelationshipType,
  RelationshipCardinalities,
} from "../../data/constants";

export default function RelationshipContextMenu({
  visible,
  x,
  y,
  onClose,
  onEdit,
  onDelete,
  onRename,
  onSwapDirection,
  onChangeType,
  onChangeCardinality,
  onSetDefaultName,
  currentType,
  currentCardinality,
}) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const menuRef = useRef();
  const [showTypeSubmenu, setShowTypeSubmenu] = useState(false);
  const [showCardinalitySubmenu, setShowCardinalitySubmenu] = useState(false);
  const [submenuPosition, setSubmenuPosition] = useState({ x: 0, y: 0 });

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

    const handleMouseLeave = () => {
      onClose();
    };

    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("keydown", handleEscape);

      // Add mouse leave event to the menu element
      const currentMenuRef = menuRef.current;
      if (currentMenuRef) {
        currentMenuRef.addEventListener("mouseleave", handleMouseLeave);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);

      // Clean up mouse leave event
      const currentMenuRef = menuRef.current;
      if (currentMenuRef) {
        currentMenuRef.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [visible, onClose]);

  const handleTypeMenuEnter = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setSubmenuPosition({
      x: rect.right,
      y: rect.top,
    });
    setShowTypeSubmenu(true);
    setShowCardinalitySubmenu(false);
  };

  const handleCardinalityMenuEnter = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setSubmenuPosition({
      x: rect.right,
      y: rect.top,
    });
    setShowCardinalitySubmenu(true);
    setShowTypeSubmenu(false);
  };

  const handleSubmenuLeave = () => {
    setShowTypeSubmenu(false);
    setShowCardinalitySubmenu(false);
  };

  const handleTypeSelect = (type) => {
    onChangeType(type);
    setShowTypeSubmenu(false);
    onClose();
  };

  const handleCardinalitySelect = (cardinality) => {
    onChangeCardinality(cardinality);
    setShowCardinalitySubmenu(false);
    onClose();
  };

  if (!visible) return null;

  const typeLabels = {
    [RelationshipType.ONE_TO_ONE]: "One to One",
    [RelationshipType.ONE_TO_MANY]: "One to Many",
  };

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
      label: "Swap Direction",
      icon: <IconLoopTextStroked />,
      onClick: () => {
        onSwapDirection();
        onClose();
      },
    },
    {
      label: "Set Default Name",
      icon: <IconRefresh />,
      onClick: () => {
        onSetDefaultName();
        onClose();
      },
    },
    {
      label: "Relationship Type",
      icon: <IconEdit />,
      hasSubmenu: true,
      onMouseEnter: handleTypeMenuEnter,
      onMouseLeave: handleSubmenuLeave,
    },
    {
      label: "Cardinality",
      icon: <IconEdit />,
      hasSubmenu: true,
      onMouseEnter: handleCardinalityMenuEnter,
      onMouseLeave: handleSubmenuLeave,
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
    <>
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
            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors justify-between ${
              item.danger
                ? "text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                : settings.mode === "light"
                  ? "text-gray-700 hover:bg-gray-100"
                  : "text-gray-200 hover:bg-zinc-700"
            }`}
            onClick={item.onClick}
            onMouseEnter={item.onMouseEnter}
            onMouseLeave={item.onMouseLeave}
          >
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 flex items-center justify-center">
                {item.icon}
              </span>
              {item.label}
            </div>
            {item.hasSubmenu && <IconChevronRight className="w-3 h-3" />}
          </button>
        ))}
      </div>

      {showTypeSubmenu && (
        <div
          className={`fixed z-50 rounded-lg shadow-lg py-1 min-w-[140px] ${
            settings.mode === "light"
              ? "bg-white border border-gray-200"
              : "bg-zinc-800 border border-zinc-600"
          }`}
          style={{
            left: submenuPosition.x,
            top: submenuPosition.y,
          }}
          onMouseEnter={() => setShowTypeSubmenu(true)}
          onMouseLeave={handleSubmenuLeave}
        >
          {Object.values(RelationshipType).map((type) => (
            <button
              key={type}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                currentType === type
                  ? settings.mode === "light"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-blue-900 text-blue-200"
                  : settings.mode === "light"
                    ? "text-gray-700 hover:bg-gray-100"
                    : "text-gray-200 hover:bg-zinc-700"
              }`}
              onClick={() => handleTypeSelect(type)}
            >
              {typeLabels[type]}
            </button>
          ))}
        </div>
      )}

      {showCardinalitySubmenu &&
        currentType &&
        RelationshipCardinalities[currentType] && (
          <div
            className={`fixed z-50 rounded-lg shadow-lg py-1 min-w-[140px] ${
              settings.mode === "light"
                ? "bg-white border border-gray-200"
                : "bg-zinc-800 border border-zinc-600"
            }`}
            style={{
              left: submenuPosition.x,
              top: submenuPosition.y,
            }}
            onMouseEnter={() => setShowCardinalitySubmenu(true)}
            onMouseLeave={handleSubmenuLeave}
          >
            {RelationshipCardinalities[currentType].map((cardinality) => (
              <button
                key={cardinality.value}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                  currentCardinality === cardinality.label
                    ? settings.mode === "light"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-blue-900 text-blue-200"
                    : settings.mode === "light"
                      ? "text-gray-700 hover:bg-gray-100"
                      : "text-gray-200 hover:bg-zinc-700"
                }`}
                onClick={() => handleCardinalitySelect(cardinality.label)}
              >
                {cardinality.label}
              </button>
            ))}
          </div>
        )}
    </>
  );
}
