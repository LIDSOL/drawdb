import { useEffect, useRef, useState } from "react";
import {
  IconEdit,
  IconDeleteStroked,
  IconLoopTextStroked,
  IconChevronRight,
  IconEdit2Stroked,
  IconRefresh,
  IconEyeOpened,
  IconEyeClosed,
} from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../hooks";
import {
  RelationshipType,
  RelationshipCardinalities,
} from "../../data/constants";
import { calculateSafePosition } from "../../utils/contextMenuUtils";

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
  relationshipData,
  onDeleteChild,
  tables,
  onToggleLabel,
}) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const menuRef = useRef();
  const [showTypeSubmenu, setShowTypeSubmenu] = useState(false);
  const [showCardinalitySubmenu, setShowCardinalitySubmenu] = useState(false);
  const [showDeleteSubmenu, setShowDeleteSubmenu] = useState(false);
  const [submenuPosition, setSubmenuPosition] = useState({ x: 0, y: 0 });

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

  const handleTypeMenuEnter = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const safeSubmenuPosition = calculateSafePosition(
      rect.right,
      rect.top,
      140,
      150,
    );
    setSubmenuPosition(safeSubmenuPosition);
    setShowTypeSubmenu(true);
    setShowCardinalitySubmenu(false);
  };

  const handleCardinalityMenuEnter = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const safeSubmenuPosition = calculateSafePosition(
      rect.right,
      rect.top,
      140,
      150,
    );
    setSubmenuPosition(safeSubmenuPosition);
    setShowCardinalitySubmenu(true);
    setShowTypeSubmenu(false);
  };

  const handleSubmenuLeave = () => {
    setShowTypeSubmenu(false);
    setShowCardinalitySubmenu(false);
    setShowDeleteSubmenu(false);
  };

  const handleDeleteMenuEnter = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const safeSubmenuPosition = calculateSafePosition(
      rect.right,
      rect.top,
      180,
      200,
    );
    setSubmenuPosition(safeSubmenuPosition);
    setShowDeleteSubmenu(true);
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

  const handleDeleteChild = (childTableId) => {
    if (onDeleteChild) {
      onDeleteChild(childTableId);
    }
    setShowDeleteSubmenu(false);
    onClose();
  };

  if (!visible) return null;

  // Calculate safe position for the main menu
  const safePosition = calculateSafePosition(x, y);

  // Determine if label should be shown based on relationship data
  // For normal relationships: default is shown (true) unless explicitly set to false
  // For subtype relationships: default is hidden (false) unless explicitly set to true
  const isLabelVisible =
    relationshipData?.showLabel !== undefined
      ? relationshipData.showLabel
      : currentType !== RelationshipType.SUBTYPE;

  const typeLabels = {
    [RelationshipType.ONE_TO_ONE]: "One to One",
    [RelationshipType.ONE_TO_MANY]: "One to Many",
    [RelationshipType.SUBTYPE]: "Subtype",
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
      label: "Set Default Name",
      icon: <IconRefresh />,
      onClick: () => {
        onSetDefaultName();
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
    ...(currentType !== RelationshipType.SUBTYPE
      ? [
          {
            label: "Swap Direction",
            icon: <IconLoopTextStroked />,
            onClick: () => {
              onSwapDirection();
              onClose();
            },
          },
        ]
      : []),
    {
      label: isLabelVisible ? "Hide Label" : "Show Label",
      icon: isLabelVisible ? <IconEyeClosed /> : <IconEyeOpened />,
      onClick: () => {
        if (onToggleLabel) {
          onToggleLabel(!isLabelVisible);
        }
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
    ...(currentType !== RelationshipType.SUBTYPE
      ? [
          {
            label: "Cardinality",
            icon: <IconEdit />,
            hasSubmenu: true,
            onMouseEnter: handleCardinalityMenuEnter,
            onMouseLeave: handleSubmenuLeave,
          },
        ]
      : []),
    {
      label: t("delete"),
      icon: <IconDeleteStroked />,
      ...(currentType === RelationshipType.SUBTYPE &&
      relationshipData?.endTableIds?.length > 1
        ? {
            hasSubmenu: true,
            onMouseEnter: handleDeleteMenuEnter,
            onMouseLeave: handleSubmenuLeave,
          }
        : {
            onClick: () => {
              onDelete();
              onClose();
            },
          }),
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
          left: safePosition.x,
          top: safePosition.y,
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

      {showDeleteSubmenu &&
        currentType === RelationshipType.SUBTYPE &&
        relationshipData?.endTableIds?.length > 1 && (
          <div
            className={`fixed z-50 rounded-lg shadow-lg py-1 min-w-[180px] ${
              settings.mode === "light"
                ? "bg-white border border-gray-200"
                : "bg-zinc-800 border border-zinc-600"
            }`}
            style={{
              left: submenuPosition.x,
              top: submenuPosition.y,
            }}
            onMouseEnter={() => setShowDeleteSubmenu(true)}
            onMouseLeave={handleSubmenuLeave}
          >
            <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Subtype Tables
            </div>
            {relationshipData.endTableIds.map((childTableId) => {
              const childTable = tables?.[childTableId];
              const parentTable = tables?.[relationshipData.startTableId];
              if (!childTable || !parentTable) return null;

              return (
                <button
                  key={childTableId}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between transition-colors ${
                    settings.mode === "light"
                      ? "text-gray-700 hover:bg-gray-100"
                      : "text-gray-200 hover:bg-zinc-700"
                  }`}
                  onClick={() => handleDeleteChild(childTableId)}
                >
                  <span className="text-xs">
                    {parentTable.name} → {childTable.name}
                  </span>
                  <IconDeleteStroked className="w-4 h-4 text-red-600" />
                </button>
              );
            })}
            <div className="border-t border-gray-200 dark:border-zinc-600 my-1"></div>
            <button
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors text-red-600 hover:text-red-700 ${
                settings.mode === "light"
                  ? "hover:bg-red-50"
                  : "hover:bg-red-900/20"
              }`}
              onClick={() => {
                onDelete();
                onClose();
              }}
            >
              <IconDeleteStroked className="w-4 h-4" />
              Delete Entire Relationship
            </button>
          </div>
        )}
    </>
  );
}
