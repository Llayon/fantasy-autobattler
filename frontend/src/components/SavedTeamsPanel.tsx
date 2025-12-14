/**
 * Saved Teams Panel component for Fantasy Autobattler Team Builder.
 * Displays player's saved teams with enhanced functionality and variants.
 * 
 * @fileoverview Panel interface for managing saved teams with modal and sidebar variants.
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { TeamResponse, UnitId, UNIT_INFO } from '@/types/game';
import { ButtonLoader, ListSkeleton } from '@/components/LoadingStates';
import { ErrorMessage, useToast } from '@/components/ErrorStates';
import { BudgetIndicator } from '@/components/BudgetIndicator';
import { getRoleIcon } from '@/lib/roleColors';
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
 * Panel display variants.
 */
export type SavedTeamsPanelVariant = 'modal' | 'sidebar';

/**
 * SavedTeamsPanel component props.
 */
interface SavedTeamsPanelProps {
  /** Panel display variant */
  variant?: SavedTeamsPanelVariant;
  /** Whether panel is open (for modal variant) */
  isOpen?: boolean;
  /** Callback when panel should close (for modal variant) */
  onClose?: () => void;
  /** Callback when team is loaded into editor */
  onLoadTeam?: (team: TeamResponse) => void;
  /** Custom CSS classes */
  className?: string;
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

/** Grid dimensions for mini preview */
const MINI_GRID_COLS = 8;
const MINI_GRID_ROWS = 2;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Unit role mapping for UI display.
 * Maps unit IDs to their roles.
 */
const UNIT_ROLES: Record<UnitId, string> = {
  // Tanks
  knight: 'tank',
  guardian: 'tank', 
  berserker: 'tank',
  // Melee DPS
  rogue: 'melee_dps',
  duelist: 'melee_dps',
  assassin: 'melee_dps',
  // Ranged DPS
  archer: 'ranged_dps',
  crossbowman: 'ranged_dps',
  hunter: 'ranged_dps',
  // Mages
  mage: 'mage',
  warlock: 'mage',
  elementalist: 'mage',
  // Support
  priest: 'support',
  bard: 'support',
  // Control
  enchanter: 'control',
};

/**
 * Get role icons preview from team units.
 * 
 * @param team - Team to analyze
 * @returns Array of role icons with counts
 */
function getRoleIconsPreview(team: TeamResponse): string {
  const roleCounts: Record<string, number> = {};
  
  team.units.forEach(unit => {
    const role = UNIT_ROLES[unit.unitId as UnitId];
    if (role) {
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    }
  });
  
  return Object.entries(roleCounts)
    .map(([role, count]) => getRoleIcon(role as UnitRole).repeat(count))
    .join('');
}

/**
 * Create mini grid representation of team.
 * 
 * @param team - Team to visualize
 * @returns 2D array representing unit positions
 */
function createMiniGrid(team: TeamResponse): (UnitId | null)[][] {
  const grid: (UnitId | null)[][] = Array(MINI_GRID_ROWS)
    .fill(null)
    .map(() => Array(MINI_GRID_COLS).fill(null));
  
  team.units.forEach(unit => {
    const { x, y } = unit.position;
    if (y < MINI_GRID_ROWS && x < MINI_GRID_COLS && grid[y]) {
      grid[y][x] = unit.unitId as UnitId;
    }
  });
  
  return grid;
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Inline editable team name component.
 */
interface EditableTeamNameProps {
  name: string;
  onSave: (newName: string) => void;
  className?: string;
}

function EditableTeamName({ name, onSave, className = '' }: EditableTeamNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditValue(name);
  };

  const handleSave = () => {
    const trimmedName = editValue.trim();
    if (trimmedName && trimmedName !== name) {
      onSave(trimmedName);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white flex-1 min-w-0"
          maxLength={50}
        />
      </div>
    );
  }

  return (
    <button
      onClick={handleStartEdit}
      className={`text-left hover:text-blue-300 transition-colors ${className}`}
      title="Click to edit name"
    >
      {name}
    </button>
  );
}

/**
 * Mini grid preview component.
 */
interface MiniGridPreviewProps {
  team: TeamResponse;
  className?: string;
}

function MiniGridPreview({ team, className = '' }: MiniGridPreviewProps) {
  const grid = createMiniGrid(team);

  return (
    <div className={`inline-block ${className}`}>
      <div className="grid grid-cols-8 gap-0.5 bg-gray-800 p-1 rounded">
        {grid.map((row, y) =>
          row.map((unitId, x) => {
            const unitInfo = unitId ? UNIT_INFO[unitId] : null;
            return (
              <div
                key={`${x}-${y}`}
                className={`
                  w-3 h-3 rounded-sm border border-gray-600 flex items-center justify-center text-[8px]
                  ${unitInfo ? unitInfo.color + ' bg-opacity-80' : 'bg-gray-700/30'}
                `}
                title={unitInfo ? `Unit at (${x}, ${y})` : `Empty (${x}, ${y})`}
              >
                {unitInfo?.emoji}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * Team card component for displaying team summary.
 */
interface TeamCardProps {
  team: TeamResponse;
  isActive: boolean;
  isFavorite: boolean;
  variant: SavedTeamsPanelVariant;
  onLoad: () => void;
  onDelete: () => void;
  onActivate: () => void;
  onToggleFavorite: () => void;
  onUpdateName: (newName: string) => void;
}

function TeamCard({ 
  team, 
  isActive, 
  isFavorite, 
  variant,
  onLoad, 
  onDelete, 
  onActivate,
  onToggleFavorite,
  onUpdateName
}: TeamCardProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const roleIcons = getRoleIconsPreview(team);
  const isCompact = variant === 'sidebar';

  // Handle swipe to delete on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0]?.clientX || 0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0]?.clientX || 0);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    // const isRightSwipe = distance < -50;

    if (isLeftSwipe && !isActive) {
      onDelete();
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Handle double-click to load
  const handleDoubleClick = () => {
    onLoad();
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      ...(isCompact ? {} : { year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    });
  };

  return (
    <div 
      className={`
        relative rounded-lg border-2 transition-all duration-200 cursor-pointer
        ${isActive 
          ? 'bg-green-900/30 border-green-500 shadow-green-500/20' 
          : 'bg-gray-800/50 border-gray-600 hover:border-gray-500'
        }
        ${isCompact ? 'p-3' : 'p-4'}
        ${isFavorite ? 'ring-2 ring-yellow-400/30' : ''}
      `}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
    >
      {/* Favorite star */}
      <button
        onClick={onToggleFavorite}
        className={`
          absolute top-2 right-2 text-lg transition-colors z-10
          ${isFavorite ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-300'}
        `}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        {isFavorite ? '⭐' : '☆'}
      </button>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute -top-2 -left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
          Active
        </div>
      )}
      
      {/* Team header */}
      <div className={`${isCompact ? 'mb-2' : 'mb-3'}`}>
        <EditableTeamName
          name={team.name}
          onSave={onUpdateName}
          className={`font-bold text-white ${isCompact ? 'text-sm' : 'text-lg'} mb-1 block`}
        />
        
        <div className="flex items-center justify-between">
          <div className={`text-gray-400 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            {formatDate(team.createdAt)}
          </div>
          
          <BudgetIndicator
            current={team.totalCost}
            max={30}
            variant="compact"
          />
        </div>
      </div>
      
      {/* Role icons preview */}
      <div className={`${isCompact ? 'mb-2' : 'mb-3'}`}>
        <div className={`text-gray-300 ${isCompact ? 'text-xs' : 'text-sm'} mb-1`}>
          Roles: <span className="text-lg">{roleIcons}</span>
        </div>
        
        {/* Mini grid preview */}
        {!isCompact && (
          <MiniGridPreview team={team} className="mt-2" />
        )}
      </div>
      
      {/* Actions */}
      <div className={`flex gap-2 ${isCompact ? 'text-xs' : ''}`}>
        <ButtonLoader
          loading={false}
          onClick={onLoad}
          variant="primary"
          size="sm"
          className="flex-1"
        >
          📝 Load
        </ButtonLoader>
        
        {!isActive && (
          <ButtonLoader
            loading={false}
            onClick={onActivate}
            variant="success"
            size="sm"
          >
            ✅
          </ButtonLoader>
        )}
        
        <ButtonLoader
          loading={false}
          onClick={onDelete}
          variant="danger"
          size="sm"
          disabled={isActive}
          className={isActive ? 'opacity-50 cursor-not-allowed' : ''}
        >
          🗑️
        </ButtonLoader>
      </div>
      
      {/* Swipe indicator for mobile */}
      {!isCompact && (
        <div className="absolute bottom-1 right-1 text-xs text-gray-500 md:hidden">
          ← Swipe to delete
        </div>
      )}
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`
        bg-gray-800 border-2 rounded-lg p-6 max-w-md w-full mx-4
        ${variantStyles[variant]}
      `}>
        <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
        <p className="text-gray-300 mb-6">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <ButtonLoader
            loading={false}
            onClick={onCancel}
            variant="secondary"
            size="md"
          >
            {cancelText}
          </ButtonLoader>
          <ButtonLoader
            loading={false}
            onClick={onConfirm}
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="md"
          >
            {confirmText}
          </ButtonLoader>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * SavedTeamsPanel component for managing player's saved teams.
 * Supports modal and sidebar variants with enhanced functionality.
 * 
 * @param props - Component props
 * @returns Saved teams panel component
 * @example
 * // Modal variant
 * <SavedTeamsPanel
 *   variant="modal"
 *   isOpen={showTeamsModal}
 *   onClose={() => setShowTeamsModal(false)}
 *   onLoadTeam={handleLoadTeam}
 * />
 * 
 * // Sidebar variant
 * <SavedTeamsPanel
 *   variant="sidebar"
 *   onLoadTeam={handleLoadTeam}
 * />
 */
export function SavedTeamsPanel({ 
  variant = 'modal',
  isOpen = true,
  onClose,
  onLoadTeam,
  className = ''
}: SavedTeamsPanelProps) {
  const [confirmAction, setConfirmAction] = useState<{
    type: TeamAction;
    team: TeamResponse | null;
  }>({ type: null, team: null });
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { showSuccess, showError } = useToast();

  // Store state
  const teams = useTeamStore(selectTeams);
  const activeTeam = useTeamStore(selectActiveTeam);
  const loading = useTeamStore(selectTeamLoading);
  const error = useTeamStore(selectTeamError);

  // Store actions
  const { loadTeams, loadTeamToDraft, deleteTeam, activateTeam, updateSavedTeamName, clearError } = useTeamStore();

  // Load teams when component mounts or modal opens
  useEffect(() => {
    if (variant === 'sidebar' || isOpen) {
      loadTeams();
    }
  }, [variant, isOpen, loadTeams]);

  // Clear error when modal closes
  useEffect(() => {
    if (variant === 'modal' && !isOpen) {
      clearError();
    }
  }, [variant, isOpen, clearError]);

  // Focus trap for modal variant
  useEffect(() => {
    if (variant !== 'modal' || !isOpen) return;

    const modalElement = document.querySelector('.fixed.inset-0 .bg-gray-900') as HTMLElement;
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
        onClose?.();
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
  }, [variant, isOpen, onClose]);

  // Sort teams: favorites first, then by creation date
  const sortedTeams = [...teams].sort((a, b) => {
    const aFav = favorites.has(a.id);
    const bFav = favorites.has(b.id);
    
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  /**
   * Handle loading team into editor.
   */
  const handleLoadTeam = useCallback((team: TeamResponse) => {
    try {
      loadTeamToDraft(team);
      onLoadTeam?.(team);
      showSuccess(`Team "${team.name}" loaded`);
      if (variant === 'modal') {
        onClose?.();
      }
    } catch (error) {
      showError('Failed to load team');
    }
  }, [loadTeamToDraft, onLoadTeam, showSuccess, showError, variant, onClose]);

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
   * Handle toggling team favorite status.
   */
  const handleToggleFavorite = useCallback((teamId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(teamId)) {
        newFavorites.delete(teamId);
      } else {
        newFavorites.add(teamId);
      }
      return newFavorites;
    });
  }, []);

  /**
   * Handle updating team name.
   */
  const handleUpdateTeamName = useCallback(async (team: TeamResponse, newName: string) => {
    try {
      await updateSavedTeamName(team.id, newName);
      showSuccess(`Team renamed to "${newName}"`);
    } catch (error) {
      showError('Failed to rename team');
    }
  }, [updateSavedTeamName, showSuccess, showError]);

  /**
   * Confirm and execute team action.
   */
  const handleConfirmAction = useCallback(async () => {
    const { type, team } = confirmAction;
    
    if (!team) return;

    try {
      if (type === 'delete') {
        await deleteTeam(team.id);
        showSuccess(`Team "${team.name}" deleted`);
      } else if (type === 'activate') {
        await activateTeam(team.id);
        showSuccess(`Team "${team.name}" activated`);
      }
    } catch (error) {
      // Error is handled by the store
    }

    setConfirmAction({ type: null, team: null });
  }, [confirmAction, deleteTeam, activateTeam, showSuccess]);

  /**
   * Cancel team action.
   */
  const handleCancelAction = useCallback(() => {
    setConfirmAction({ type: null, team: null });
  }, []);

  // Don't render modal variant when closed
  if (variant === 'modal' && !isOpen) return null;

  const content = (
    <>
      {/* Header */}
      {variant === 'modal' && (
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">My Teams</h2>
            <p className="text-gray-400 text-sm mt-1">
              {teams.length}/{MAX_TEAMS} teams saved
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl transition-colors"
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Content */}
      <div className={`flex-1 overflow-y-auto ${variant === 'modal' ? 'p-6' : 'p-4'}`}>
        {/* Loading state */}
        {loading && (
          <ListSkeleton items={variant === 'sidebar' ? 2 : 3} />
        )}
        
        {/* Error state */}
        {error && (
          <div className="mb-6">
            <ErrorMessage
              message={error}
              severity="error"
              showRetry
              onRetry={loadTeams}
              onDismiss={clearError}
            />
          </div>
        )}
        
        {/* Empty state */}
        {!loading && teams.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <div className="text-xl text-gray-400 mb-2">No saved teams</div>
            <p className="text-gray-500">
              Save your first team!
            </p>
          </div>
        )}
        
        {/* Teams grid */}
        {!loading && teams.length > 0 && (
          <div className={`
            grid gap-4 
            ${variant === 'sidebar' 
              ? 'grid-cols-1' 
              : 'md:grid-cols-2 lg:grid-cols-3'
            }
          `}>
            {sortedTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                isActive={activeTeam?.id === team.id}
                isFavorite={favorites.has(team.id)}
                variant={variant}
                onLoad={() => handleLoadTeam(team)}
                onDelete={() => handleDeleteTeam(team)}
                onActivate={() => handleActivateTeam(team)}
                onToggleFavorite={() => handleToggleFavorite(team.id)}
                onUpdateName={(newName) => handleUpdateTeamName(team, newName)}
              />
            ))}
          </div>
        )}
        
        {/* Team limit warning */}
        {teams.length >= MAX_TEAMS && (
          <div className="mt-6 bg-yellow-900/30 border border-yellow-500 rounded-lg p-4">
            <div className="text-yellow-300">
              <div className="font-medium mb-1">⚠️ Team limit reached</div>
              <p className="text-sm">
                Maximum {MAX_TEAMS} teams for MVP version. 
                Delete unused teams to create new ones.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      {variant === 'modal' && (
        <div className="border-t border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              💡 Active team is used for matchmaking
            </div>
            
            <ButtonLoader
              loading={false}
              onClick={onClose}
              variant="secondary"
              size="md"
            >
              Close
            </ButtonLoader>
          </div>
        </div>
      )}
    </>
  );

  // Render based on variant
  if (variant === 'sidebar') {
    return (
      <div className={`bg-gray-900 border border-gray-700 rounded-lg flex flex-col ${className}`}>
        {content}
        
        {/* Confirmation dialogs */}
        <ConfirmDialog
          isOpen={confirmAction.type === 'delete'}
          title="Delete Team"
          message={`Are you sure you want to delete team "${confirmAction.team?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleConfirmAction}
          onCancel={handleCancelAction}
        />
        
        <ConfirmDialog
          isOpen={confirmAction.type === 'activate'}
          title="Activate Team"
          message={`Activate team "${confirmAction.team?.name}" for matchmaking? Current active team will be deactivated.`}
          confirmText="Activate"
          cancelText="Cancel"
          variant="info"
          onConfirm={handleConfirmAction}
          onCancel={handleCancelAction}
        />
      </div>
    );
  }

  // Modal variant
  return (
    <>
      {/* Main modal */}
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-40"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose?.();
          }
        }}
      >
        <div 
          className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-4xl max-h-[90vh] mx-4 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="saved-teams-title"
          aria-describedby="saved-teams-description"
        >
          {content}
        </div>
      </div>
      
      {/* Confirmation dialogs */}
      <ConfirmDialog
        isOpen={confirmAction.type === 'delete'}
        title="Delete Team"
        message={`Are you sure you want to delete team "${confirmAction.team?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />
      
      <ConfirmDialog
        isOpen={confirmAction.type === 'activate'}
        title="Activate Team"
        message={`Activate team "${confirmAction.team?.name}" for matchmaking? Current active team will be deactivated.`}
        confirmText="Activate"
        cancelText="Cancel"
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

export type { SavedTeamsPanelProps };