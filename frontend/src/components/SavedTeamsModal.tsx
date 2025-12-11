/**
 * Saved Teams Modal component for Fantasy Autobattler Team Builder.
 * Displays player's saved teams with load, delete, and activate functionality.
 * 
 * @fileoverview Modal interface for managing saved teams with MVP limit of 5 teams.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { TeamResponse, UnitId, UNIT_INFO } from '@/types/game';
import { 
  useTeamStore, 
  selectTeams, 
  selectTeamLoading, 
  selectTeamError,
  selectActiveTeam 
} from '@/store/teamStore';

// =============================================================================
// TYPES
// =============================================================================

/**
 * SavedTeamsModal component props.
 */
interface SavedTeamsModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when team is loaded into editor */
  onLoadTeam?: (team: TeamResponse) => void;
}

/**
 * Team action types for confirmation dialogs.
 */
type TeamAction = 'delete' | 'activate' | null;

// =============================================================================
// CONSTANTS
// =============================================================================

/** Maximum number of teams for MVP */
const MAX_TEAMS = 5;

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Team card component for displaying team summary.
 */
interface TeamCardProps {
  team: TeamResponse;
  isActive: boolean;
  onLoad: () => void;
  onDelete: () => void;
  onActivate: () => void;
}

function TeamCard({ team, isActive, onLoad, onDelete, onActivate }: TeamCardProps) {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`
      relative p-4 rounded-lg border-2 transition-all duration-200
      ${isActive 
        ? 'bg-green-900/30 border-green-500 shadow-green-500/20' 
        : 'bg-gray-800/50 border-gray-600 hover:border-gray-500'
      }
    `}>
      {/* Active indicator */}
      {isActive && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
          Активна
        </div>
      )}
      
      {/* Team header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg text-white mb-1">
            {team.name}
          </h3>
          <div className="text-sm text-gray-400">
            Создана: {formatDate(team.createdAt)}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-bold text-yellow-400">
            {team.totalCost}/30
          </div>
          <div className="text-xs text-gray-400">
            {team.units.length} юнитов
          </div>
        </div>
      </div>
      
      {/* Units preview */}
      <div className="mb-4">
        <div className="text-sm text-gray-300 mb-2">Состав команды:</div>
        <div className="flex flex-wrap gap-1">
          {team.units.map((unit, index) => {
            const unitInfo = UNIT_INFO[unit.unitId as UnitId];
            return (
              <div
                key={index}
                className="flex items-center gap-1 bg-gray-700/50 px-2 py-1 rounded text-xs"
                title={`${unit.name} (${unit.cost} очков)`}
              >
                <span>{unitInfo?.emoji || '❓'}</span>
                <span className="text-gray-300">{unit.name}</span>
                <span className="text-yellow-400">{unit.cost}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onLoad}
          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition-colors"
        >
          📝 Редактировать
        </button>
        
        {!isActive && (
          <button
            onClick={onActivate}
            className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded transition-colors"
          >
            ✅ Активировать
          </button>
        )}
        
        <button
          onClick={onDelete}
          className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded transition-colors"
          disabled={isActive}
          title={isActive ? 'Нельзя удалить активную команду' : 'Удалить команду'}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

/**
 * Confirmation dialog component.
 */
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  variant = 'info',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: 'border-red-500 bg-red-900/20',
    warning: 'border-yellow-500 bg-yellow-900/20',
    info: 'border-blue-500 bg-blue-900/20',
  };

  const buttonStyles = {
    danger: 'bg-red-600 hover:bg-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-500',
    info: 'bg-blue-600 hover:bg-blue-500',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`
        bg-gray-800 border-2 rounded-lg p-6 max-w-md w-full mx-4
        ${variantStyles[variant]}
      `}>
        <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
        <p className="text-gray-300 mb-6">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded transition-colors ${buttonStyles[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * SavedTeamsModal component for managing player's saved teams.
 * Provides interface to load, delete, and activate teams with MVP limit of 5 teams.
 * 
 * @param props - Component props
 * @returns Saved teams modal component
 * @example
 * <SavedTeamsModal
 *   isOpen={showTeamsModal}
 *   onClose={() => setShowTeamsModal(false)}
 *   onLoadTeam={handleLoadTeam}
 * />
 */
export function SavedTeamsModal({ isOpen, onClose, onLoadTeam }: SavedTeamsModalProps) {
  const [confirmAction, setConfirmAction] = useState<{
    type: TeamAction;
    team: TeamResponse | null;
  }>({ type: null, team: null });

  // Store state
  const teams = useTeamStore(selectTeams);
  const activeTeam = useTeamStore(selectActiveTeam);
  const loading = useTeamStore(selectTeamLoading);
  const error = useTeamStore(selectTeamError);

  // Store actions
  const { loadTeams, loadTeamToDraft, deleteTeam, activateTeam, clearError } = useTeamStore();

  // Load teams when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTeams();
    }
  }, [isOpen, loadTeams]);

  // Clear error when modal closes
  useEffect(() => {
    if (!isOpen) {
      clearError();
    }
  }, [isOpen, clearError]);

  /**
   * Handle loading team into editor.
   */
  const handleLoadTeam = useCallback((team: TeamResponse) => {
    loadTeamToDraft(team);
    onLoadTeam?.(team);
    onClose();
  }, [loadTeamToDraft, onLoadTeam, onClose]);

  /**
   * Handle team deletion with confirmation.
   */
  const handleDeleteTeam = useCallback((team: TeamResponse) => {
    setConfirmAction({ type: 'delete', team });
  }, []);

  /**
   * Handle team activation with confirmation.
   */
  const handleActivateTeam = useCallback((team: TeamResponse) => {
    setConfirmAction({ type: 'activate', team });
  }, []);

  /**
   * Confirm and execute team action.
   */
  const handleConfirmAction = useCallback(async () => {
    const { type, team } = confirmAction;
    
    if (!team) return;

    try {
      if (type === 'delete') {
        await deleteTeam(team.id);
      } else if (type === 'activate') {
        await activateTeam(team.id);
      }
    } catch (error) {
      // Error is handled by the store
    }

    setConfirmAction({ type: null, team: null });
  }, [confirmAction, deleteTeam, activateTeam]);

  /**
   * Cancel team action.
   */
  const handleCancelAction = useCallback(() => {
    setConfirmAction({ type: null, team: null });
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Main modal */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
        <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-4xl max-h-[90vh] mx-4 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-white">Мои команды</h2>
              <p className="text-gray-400 text-sm mt-1">
                {teams.length}/{MAX_TEAMS} команд сохранено
              </p>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Loading state */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="text-4xl mb-4">⏳</div>
                  <div className="text-xl text-yellow-400">Загрузка команд...</div>
                </div>
              </div>
            )}
            
            {/* Error state */}
            {error && (
              <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-6">
                <div className="text-red-300">
                  <div className="font-medium mb-1">Ошибка:</div>
                  <p>{error}</p>
                </div>
              </div>
            )}
            
            {/* Empty state */}
            {!loading && teams.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <div className="text-xl text-gray-400 mb-2">Нет сохранённых команд</div>
                <p className="text-gray-500">
                  Создайте команду в редакторе и нажмите "Сохранить"
                </p>
              </div>
            )}
            
            {/* Teams grid */}
            {!loading && teams.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teams.map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    isActive={activeTeam?.id === team.id}
                    onLoad={() => handleLoadTeam(team)}
                    onDelete={() => handleDeleteTeam(team)}
                    onActivate={() => handleActivateTeam(team)}
                  />
                ))}
              </div>
            )}
            
            {/* Team limit warning */}
            {teams.length >= MAX_TEAMS && (
              <div className="mt-6 bg-yellow-900/30 border border-yellow-500 rounded-lg p-4">
                <div className="text-yellow-300">
                  <div className="font-medium mb-1">⚠️ Достигнут лимит команд</div>
                  <p className="text-sm">
                    Максимум {MAX_TEAMS} команд для MVP версии. 
                    Удалите неиспользуемые команды для создания новых.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="border-t border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                💡 Активная команда используется для поиска боёв
              </div>
              
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Confirmation dialogs */}
      <ConfirmDialog
        isOpen={confirmAction.type === 'delete'}
        title="Удалить команду"
        message={`Вы уверены, что хотите удалить команду "${confirmAction.team?.name}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />
      
      <ConfirmDialog
        isOpen={confirmAction.type === 'activate'}
        title="Активировать команду"
        message={`Активировать команду "${confirmAction.team?.name}" для поиска боёв? Текущая активная команда будет деактивирована.`}
        confirmText="Активировать"
        cancelText="Отмена"
        variant="info"
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />
    </>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { SavedTeamsModalProps };