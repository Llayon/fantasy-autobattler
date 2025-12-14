'use client';

import React, { useEffect } from 'react';
import { UnitTemplate } from '@/types/game';
import { UNIT_INFO } from '@/types/game';
import { getRoleColor, getRoleIcon, getRoleName } from '@/lib/roleColors';

/**
 * Props for the UnitDetailModal component
 */
interface UnitDetailModalProps {
  /** Unit to display details for */
  unit: UnitTemplate | null;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when unit is added to team */
  onAddToTeam?: (unit: UnitTemplate) => void;
  /** Whether the unit can be added to team */
  canAdd: boolean;
  /** Reason why unit cannot be added (shown when canAdd is false) */
  cannotAddReason?: string;
}

/**
 * Modal component displaying detailed information about a unit
 * Shows all stats, abilities, and provides option to add to team
 */
export default function UnitDetailModal({
  unit,
  isOpen,
  onClose,
  onAddToTeam,
  canAdd,
  cannotAddReason
}: UnitDetailModalProps) {
  // Handle Escape key and focus trap
  useEffect(() => {
    if (!isOpen) return;

    const modalElement = document.querySelector('[role="dialog"]') as HTMLElement;
    if (!modalElement) return;

    // Get all focusable elements within modal
    const focusableElements = modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Focus first element when modal opens
    if (firstFocusable) {
      firstFocusable.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      // Handle Tab key for focus trap
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusable) {
            event.preventDefault();
            lastFocusable?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusable) {
            event.preventDefault();
            firstFocusable?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Don't render if not open or no unit
  if (!isOpen || !unit) {
  
    return null;
  }



  const unitInfo = UNIT_INFO[unit.id];
  const roleColor = getRoleColor(unit.role);

  /**
   * Handle adding unit to team
   */
  const handleAddToTeam = () => {
    if (canAdd && onAddToTeam) {
      onAddToTeam(unit);
      onClose();
    }
  };

  /**
   * Handle backdrop click to close modal
   */
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="unit-detail-title"
      aria-describedby="unit-detail-description"
    >
      <div className="relative w-full max-w-md bg-gray-900 rounded-xl border border-gray-700 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Закрыть модальное окно"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">{unitInfo.emoji}</div>
            <div>
              <h2 id="unit-detail-title" className="text-xl font-bold text-white">
                {unit.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span 
                  className="px-2 py-1 text-xs font-medium rounded-full"
                  style={{ 
                    backgroundColor: `${roleColor.bg}20`,
                    color: roleColor.bg,
                    border: `1px solid ${roleColor.bg}40`
                  }}
                >
                  {getRoleIcon(unit.role)} {getRoleName(unit.role)}
                </span>
                <span className="px-2 py-1 text-xs font-bold bg-yellow-500 text-black rounded-full">
                  {unit.cost} очков
                </span>
              </div>
            </div>
          </div>

          {/* Unit description */}
          <p id="unit-detail-description" className="text-gray-300 text-sm leading-relaxed">
            {unitInfo.description}
          </p>
        </div>

        {/* Stats section */}
        <div className="px-6 pb-4">
          <h3 className="text-lg font-semibold text-white mb-3">Характеристики</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
              <span className="text-red-400">❤️</span>
              <span className="text-sm text-gray-300">HP:</span>
              <span className="font-bold text-white">{unit.stats.hp}</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
              <span className="text-orange-400">⚔️</span>
              <span className="text-sm text-gray-300">ATK:</span>
              <span className="font-bold text-white">{unit.stats.atk}</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
              <span className="text-yellow-400">🗡️</span>
              <span className="text-sm text-gray-300">#ATK:</span>
              <span className="font-bold text-white">{unit.stats.atkCount}</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
              <span className="text-blue-400">🛡️</span>
              <span className="text-sm text-gray-300">BR:</span>
              <span className="font-bold text-white">{unit.stats.armor}</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
              <span className="text-green-400">💨</span>
              <span className="text-sm text-gray-300">СК:</span>
              <span className="font-bold text-white">{unit.stats.speed}</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
              <span className="text-purple-400">⚡</span>
              <span className="text-sm text-gray-300">ИН:</span>
              <span className="font-bold text-white">{unit.stats.initiative}</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
              <span className="text-cyan-400">🌪️</span>
              <span className="text-sm text-gray-300">УК:</span>
              <span className="font-bold text-white">{unit.stats.dodge}%</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
              <span className="text-indigo-400">🎯</span>
              <span className="text-sm text-gray-300">Range:</span>
              <span className="font-bold text-white">{unit.range}</span>
            </div>
          </div>
        </div>

        {/* Abilities section */}
        {unit.abilities && unit.abilities.length > 0 && (
          <div className="px-6 pb-4">
            <h3 className="text-lg font-semibold text-white mb-3">Способности</h3>
            <div className="space-y-2">
              {unit.abilities.map((ability, index) => (
                <div key={index} className="p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-400">✨</span>
                    <span className="font-medium text-white">{ability}</span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Описание способности
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cannot add reason */}
        {!canAdd && cannotAddReason && (
          <div className="px-6 pb-4">
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-red-400">⚠️</span>
                <span className="text-sm text-red-300">{cannotAddReason}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Закрыть
          </button>
          {onAddToTeam && (
            <button
              onClick={handleAddToTeam}
              disabled={!canAdd}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                canAdd
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
              aria-label={canAdd ? 'Добавить юнита в команду' : 'Нельзя добавить юнита в команду'}
            >
              Добавить в команду
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

