/**
 * Unified Tooltip System for Fantasy Autobattler.
 * Provides tooltips with auto-positioning, delay, touch support, and rich content.
 * 
 * @fileoverview Comprehensive tooltip component with accessibility and mobile support.
 */

'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
  ReactNode,
  CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Tooltip placement options.
 */
type TooltipPlacement = 
  | 'top' 
  | 'bottom' 
  | 'left' 
  | 'right'
  | 'top-start'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-end';

/**
 * Tooltip trigger modes.
 */
type TooltipTrigger = 'hover' | 'click' | 'focus' | 'manual';

/**
 * Tooltip theme variants.
 */
type TooltipTheme = 'dark' | 'light' | 'info' | 'warning' | 'error' | 'success';

/**
 * Tooltip component props.
 */
interface TooltipProps {
  /** Tooltip content - can be string or React elements */
  content: ReactNode;
  /** Element that triggers the tooltip */
  children: ReactNode;

  /** Preferred placement (auto-adjusts if doesn't fit) */
  placement?: TooltipPlacement;
  /** How tooltip is triggered */
  trigger?: TooltipTrigger | TooltipTrigger[];
  /** Delay before showing tooltip (ms) */
  showDelay?: number;
  /** Delay before hiding tooltip (ms) */
  hideDelay?: number;
  /** Visual theme */
  theme?: TooltipTheme;
  /** Whether tooltip is disabled */
  disabled?: boolean;
  /** Maximum width of tooltip */
  maxWidth?: number;
  /** Custom className for tooltip content */
  className?: string;
  /** Whether to show arrow */
  showArrow?: boolean;
  /** Offset from trigger element (px) */
  offset?: number;
  /** Controlled visibility state */
  isOpen?: boolean;
  /** Callback when visibility changes */
  onOpenChange?: (isOpen: boolean) => void;
  /** Long press duration for touch devices (ms) */
  longPressDuration?: number;
  /** Whether tooltip should be interactive (hoverable) */
  interactive?: boolean;
  /** Z-index for tooltip */
  zIndex?: number;
  /** Accessible label for screen readers */
  ariaLabel?: string;
}

/**
 * Position calculation result.
 */
interface TooltipPosition {
  top: number;
  left: number;
  actualPlacement: TooltipPlacement;
}

/**
 * Tooltip context for global configuration.
 */
interface TooltipContextValue {
  defaultDelay: number;
  defaultTheme: TooltipTheme;
  portalContainer: HTMLElement | null;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Default show delay in milliseconds */
const DEFAULT_SHOW_DELAY = 300;

/** Default hide delay in milliseconds */
const DEFAULT_HIDE_DELAY = 100;

/** Default offset from trigger element */
const DEFAULT_OFFSET = 8;

/** Default max width for tooltip */
const DEFAULT_MAX_WIDTH = 300;

/** Long press duration for touch devices */
const DEFAULT_LONG_PRESS_DURATION = 500;

/** Viewport padding to prevent edge overflow */
const VIEWPORT_PADDING = 8;

/** Arrow size in pixels */
const ARROW_SIZE = 6;

/** Theme color configurations */
const THEME_STYLES: Record<TooltipTheme, string> = {
  dark: 'bg-gray-900 text-white border-gray-700',
  light: 'bg-white text-gray-900 border-gray-200',
  info: 'bg-blue-900 text-blue-100 border-blue-700',
  warning: 'bg-yellow-900 text-yellow-100 border-yellow-700',
  error: 'bg-red-900 text-red-100 border-red-700',
  success: 'bg-green-900 text-green-100 border-green-700',
};

/** Arrow color configurations */
const ARROW_STYLES: Record<TooltipTheme, string> = {
  dark: 'border-gray-900',
  light: 'border-white',
  info: 'border-blue-900',
  warning: 'border-yellow-900',
  error: 'border-red-900',
  success: 'border-green-900',
};

// =============================================================================
// CONTEXT
// =============================================================================

const TooltipContext = createContext<TooltipContextValue>({
  defaultDelay: DEFAULT_SHOW_DELAY,
  defaultTheme: 'dark',
  portalContainer: null,
});

/**
 * Hook to access tooltip context.
 * 
 * @returns Tooltip context value
 */
export function useTooltipContext(): TooltipContextValue {
  return useContext(TooltipContext);
}


// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate optimal tooltip position based on trigger element and viewport.
 * Automatically adjusts placement if tooltip would overflow viewport.
 * 
 * @param triggerRect - Bounding rect of trigger element
 * @param tooltipRect - Bounding rect of tooltip element
 * @param preferredPlacement - Preferred placement
 * @param offset - Offset from trigger element
 * @returns Calculated position and actual placement
 */
function calculatePosition(
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  preferredPlacement: TooltipPlacement,
  offset: number
): TooltipPosition {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  // Calculate positions for each placement
  const positions: Record<TooltipPlacement, { top: number; left: number }> = {
    top: {
      top: triggerRect.top - tooltipRect.height - offset,
      left: triggerRect.left + (triggerRect.width - tooltipRect.width) / 2,
    },
    bottom: {
      top: triggerRect.bottom + offset,
      left: triggerRect.left + (triggerRect.width - tooltipRect.width) / 2,
    },
    left: {
      top: triggerRect.top + (triggerRect.height - tooltipRect.height) / 2,
      left: triggerRect.left - tooltipRect.width - offset,
    },
    right: {
      top: triggerRect.top + (triggerRect.height - tooltipRect.height) / 2,
      left: triggerRect.right + offset,
    },
    'top-start': {
      top: triggerRect.top - tooltipRect.height - offset,
      left: triggerRect.left,
    },
    'top-end': {
      top: triggerRect.top - tooltipRect.height - offset,
      left: triggerRect.right - tooltipRect.width,
    },
    'bottom-start': {
      top: triggerRect.bottom + offset,
      left: triggerRect.left,
    },
    'bottom-end': {
      top: triggerRect.bottom + offset,
      left: triggerRect.right - tooltipRect.width,
    },
  };

  /**
   * Check if position fits within viewport.
   */
  const fitsInViewport = (pos: { top: number; left: number }): boolean => {
    return (
      pos.top >= VIEWPORT_PADDING &&
      pos.left >= VIEWPORT_PADDING &&
      pos.top + tooltipRect.height <= viewport.height - VIEWPORT_PADDING &&
      pos.left + tooltipRect.width <= viewport.width - VIEWPORT_PADDING
    );
  };

  // Try preferred placement first
  let position = positions[preferredPlacement];
  let actualPlacement = preferredPlacement;

  if (!fitsInViewport(position)) {
    // Define fallback order based on preferred placement
    const fallbackOrder: Record<TooltipPlacement, TooltipPlacement[]> = {
      top: ['bottom', 'left', 'right', 'top-start', 'top-end'],
      bottom: ['top', 'left', 'right', 'bottom-start', 'bottom-end'],
      left: ['right', 'top', 'bottom', 'top-start', 'bottom-start'],
      right: ['left', 'top', 'bottom', 'top-end', 'bottom-end'],
      'top-start': ['top-end', 'bottom-start', 'top', 'bottom'],
      'top-end': ['top-start', 'bottom-end', 'top', 'bottom'],
      'bottom-start': ['bottom-end', 'top-start', 'bottom', 'top'],
      'bottom-end': ['bottom-start', 'top-end', 'bottom', 'top'],
    };

    // Try fallback placements
    for (const fallback of fallbackOrder[preferredPlacement]) {
      const fallbackPos = positions[fallback];
      if (fitsInViewport(fallbackPos)) {
        position = fallbackPos;
        actualPlacement = fallback;
        break;
      }
    }
  }

  // Clamp position to viewport bounds
  const clampedPosition = {
    top: Math.max(
      VIEWPORT_PADDING,
      Math.min(position.top, viewport.height - tooltipRect.height - VIEWPORT_PADDING)
    ),
    left: Math.max(
      VIEWPORT_PADDING,
      Math.min(position.left, viewport.width - tooltipRect.width - VIEWPORT_PADDING)
    ),
  };

  return {
    ...clampedPosition,
    actualPlacement,
  };
}

/**
 * Get arrow position styles based on placement.
 * 
 * @param placement - Tooltip placement
 * @returns CSS properties for arrow positioning
 */
function getArrowStyles(placement: TooltipPlacement): CSSProperties {
  const base: CSSProperties = {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderWidth: ARROW_SIZE,
  };

  switch (placement) {
    case 'top':
    case 'top-start':
    case 'top-end':
      return {
        ...base,
        bottom: -ARROW_SIZE * 2,
        left: placement === 'top' ? '50%' : placement === 'top-start' ? '16px' : 'auto',
        right: placement === 'top-end' ? '16px' : 'auto',
        transform: placement === 'top' ? 'translateX(-50%)' : undefined,
        borderColor: 'inherit transparent transparent transparent',
      };
    case 'bottom':
    case 'bottom-start':
    case 'bottom-end':
      return {
        ...base,
        top: -ARROW_SIZE * 2,
        left: placement === 'bottom' ? '50%' : placement === 'bottom-start' ? '16px' : 'auto',
        right: placement === 'bottom-end' ? '16px' : 'auto',
        transform: placement === 'bottom' ? 'translateX(-50%)' : undefined,
        borderColor: 'transparent transparent inherit transparent',
      };
    case 'left':
      return {
        ...base,
        right: -ARROW_SIZE * 2,
        top: '50%',
        transform: 'translateY(-50%)',
        borderColor: 'transparent transparent transparent inherit',
      };
    case 'right':
      return {
        ...base,
        left: -ARROW_SIZE * 2,
        top: '50%',
        transform: 'translateY(-50%)',
        borderColor: 'transparent inherit transparent transparent',
      };
    default:
      return base;
  }
}


// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook for managing tooltip visibility with delays.
 * 
 * @param showDelay - Delay before showing
 * @param hideDelay - Delay before hiding
 * @param onOpenChange - Callback when visibility changes
 * @returns Visibility state and control functions
 */
function useTooltipVisibility(
  showDelay: number,
  hideDelay: number,
  onOpenChange?: (isOpen: boolean) => void
) {
  const [isVisible, setIsVisible] = useState(false);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimeouts = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const show = useCallback(() => {
    clearTimeouts();
    showTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      onOpenChange?.(true);
    }, showDelay);
  }, [showDelay, clearTimeouts, onOpenChange]);

  const hide = useCallback(() => {
    clearTimeouts();
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      onOpenChange?.(false);
    }, hideDelay);
  }, [hideDelay, clearTimeouts, onOpenChange]);

  const toggle = useCallback(() => {
    if (isVisible) {
      hide();
    } else {
      show();
    }
  }, [isVisible, show, hide]);

  const showImmediate = useCallback(() => {
    clearTimeouts();
    setIsVisible(true);
    onOpenChange?.(true);
  }, [clearTimeouts, onOpenChange]);

  const hideImmediate = useCallback(() => {
    clearTimeouts();
    setIsVisible(false);
    onOpenChange?.(false);
  }, [clearTimeouts, onOpenChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimeouts();
  }, [clearTimeouts]);

  return {
    isVisible,
    show,
    hide,
    toggle,
    showImmediate,
    hideImmediate,
    clearTimeouts,
  };
}

/**
 * Hook for handling long press on touch devices.
 * 
 * @param onLongPress - Callback when long press is detected
 * @param duration - Duration to trigger long press
 * @returns Event handlers for touch events
 */
function useLongPress(
  onLongPress: () => void,
  duration: number = DEFAULT_LONG_PRESS_DURATION
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const start = useCallback(() => {
    isLongPressRef.current = false;
    timeoutRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress();
    }, duration);
  }, [onLongPress, duration]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cancel();
  }, [cancel]);

  return {
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: cancel,
    isLongPress: () => isLongPressRef.current,
  };
}


// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Tooltip content component rendered in portal.
 */
function TooltipContent({
  content,
  position,
  placement,
  theme,
  maxWidth,
  showArrow,
  className,
  zIndex,
  onMouseEnter,
  onMouseLeave,
}: {
  content: ReactNode;
  position: { top: number; left: number };
  placement: TooltipPlacement;
  theme: TooltipTheme;
  maxWidth: number;
  showArrow: boolean;
  className?: string;
  zIndex: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  return (
    <div
      role="tooltip"
      className={`
        fixed px-3 py-2 rounded-lg border shadow-lg
        text-sm leading-relaxed
        animate-in fade-in-0 zoom-in-95 duration-150
        ${THEME_STYLES[theme]}
        ${className || ''}
      `}
      style={{
        top: position.top,
        left: position.left,
        maxWidth,
        zIndex,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {content}
      {showArrow && (
        <div
          className={ARROW_STYLES[theme]}
          style={getArrowStyles(placement)}
        />
      )}
    </div>
  );
}

/**
 * Main Tooltip component with auto-positioning, delay, and touch support.
 * 
 * @param props - Tooltip props
 * @returns Tooltip component wrapping children
 * @example
 * // Simple text tooltip
 * <Tooltip content="This is a tooltip">
 *   <button>Hover me</button>
 * </Tooltip>
 * 
 * @example
 * // Rich content tooltip
 * <Tooltip 
 *   content={
 *     <div>
 *       <h4 className="font-bold">Knight</h4>
 *       <p>HP: 100 | ATK: 15</p>
 *     </div>
 *   }
 *   placement="right"
 *   theme="info"
 * >
 *   <UnitCard unit={knight} />
 * </Tooltip>
 * 
 * @example
 * // Click-triggered tooltip
 * <Tooltip content="Click tooltip" trigger="click">
 *   <button>Click me</button>
 * </Tooltip>
 */
export function Tooltip({
  content,
  children,
  placement = 'top',
  trigger = 'hover',
  showDelay = DEFAULT_SHOW_DELAY,
  hideDelay = DEFAULT_HIDE_DELAY,
  theme = 'dark',
  disabled = false,
  maxWidth = DEFAULT_MAX_WIDTH,
  className,
  showArrow = true,
  offset = DEFAULT_OFFSET,
  isOpen: controlledIsOpen,
  onOpenChange,
  longPressDuration = DEFAULT_LONG_PRESS_DURATION,
  interactive = false,
  zIndex = 9999,
  ariaLabel,
}: TooltipProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const [mounted, setMounted] = useState(false);

  const triggers = Array.isArray(trigger) ? trigger : [trigger];
  const isControlled = controlledIsOpen !== undefined;

  const {
    isVisible: internalIsVisible,
    show,
    hide,
    toggle,
    showImmediate,
    hideImmediate,
  } = useTooltipVisibility(showDelay, hideDelay, onOpenChange);

  const isVisible = isControlled ? controlledIsOpen : internalIsVisible;

  const longPress = useLongPress(() => {
    if (triggers.includes('hover')) {
      showImmediate();
    }
  }, longPressDuration);

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate position when visible
  useEffect(() => {
    if (!isVisible || !triggerRef.current) return;

    const updatePosition = () => {
      const triggerRect = triggerRef.current?.getBoundingClientRect();
      if (!triggerRect) return;

      // Create temporary element to measure tooltip
      const tempDiv = document.createElement('div');
      tempDiv.style.cssText = `
        position: fixed;
        visibility: hidden;
        max-width: ${maxWidth}px;
        padding: 8px 12px;
      `;
      tempDiv.innerHTML = typeof content === 'string' ? content : '';
      document.body.appendChild(tempDiv);
      
      const tooltipRect = tooltipRef.current?.getBoundingClientRect() || tempDiv.getBoundingClientRect();
      document.body.removeChild(tempDiv);

      const newPosition = calculatePosition(triggerRect, tooltipRect, placement, offset);
      setPosition(newPosition);
    };

    updatePosition();

    // Update position on scroll/resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible, content, placement, offset, maxWidth]);

  // Close on escape key
  useEffect(() => {
    if (!isVisible) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        hideImmediate();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, hideImmediate]);

  // Close on click outside for click trigger
  useEffect(() => {
    if (!isVisible || !triggers.includes('click')) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        hideImmediate();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisible, triggers, hideImmediate]);

  if (disabled || !content) {
    return <>{children}</>;
  }

  // Event handlers based on trigger type
  const eventHandlers: Record<string, () => void> = {};

  if (triggers.includes('hover')) {
    eventHandlers.onMouseEnter = show;
    eventHandlers.onMouseLeave = hide;
  }

  if (triggers.includes('click')) {
    eventHandlers.onClick = toggle;
  }

  if (triggers.includes('focus')) {
    eventHandlers.onFocus = show;
    eventHandlers.onBlur = hide;
  }

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-block"
        aria-describedby={isVisible ? 'tooltip' : undefined}
        aria-label={ariaLabel}
        {...eventHandlers}
        {...(triggers.includes('hover') ? longPress : {})}
      >
        {children}
      </div>

      {mounted && isVisible && position && createPortal(
        <div ref={tooltipRef}>
          <TooltipContent
            content={content}
            position={position}
            placement={position.actualPlacement}
            theme={theme}
            maxWidth={maxWidth}
            showArrow={showArrow}
            className={className}
            zIndex={zIndex}
            onMouseEnter={interactive ? show : undefined}
            onMouseLeave={interactive ? hide : undefined}
          />
        </div>,
        document.body
      )}
    </>
  );
}


// =============================================================================
// SPECIALIZED TOOLTIP COMPONENTS
// =============================================================================

/**
 * Props for UnitTooltip component.
 */
interface UnitTooltipProps {
  /** Unit name */
  name: string;
  /** Unit role */
  role: string;
  /** Unit cost */
  cost: number;
  /** Unit stats */
  stats: {
    hp: number;
    atk: number;
    armor: number;
    speed: number;
    initiative: number;
    dodge: number;
    range: number;
    atkCount: number;
  };
  /** Unit abilities */
  abilities?: string[];
  /** Tooltip placement */
  placement?: TooltipPlacement;
  /** Children to wrap */
  children: ReactNode;
}

/**
 * Specialized tooltip for displaying unit information.
 * 
 * @param props - UnitTooltip props
 * @returns Unit tooltip component
 * @example
 * <UnitTooltip
 *   name="Knight"
 *   role="Tank"
 *   cost={5}
 *   stats={{ hp: 100, atk: 15, armor: 8, speed: 2, initiative: 3, dodge: 5, range: 1, atkCount: 1 }}
 * >
 *   <UnitCard unit={knight} />
 * </UnitTooltip>
 */
export function UnitTooltip({
  name,
  role,
  cost,
  stats,
  abilities = [],
  placement = 'right',
  children,
}: UnitTooltipProps) {
  const content = (
    <div className="space-y-2 min-w-[200px]">
      <div className="flex items-center justify-between border-b border-gray-600 pb-2">
        <span className="font-bold text-yellow-400">{name}</span>
        <span className="text-xs bg-gray-700 px-2 py-1 rounded">{role}</span>
      </div>
      
      <div className="text-xs text-gray-400">
        Стоимость: <span className="text-yellow-300">{cost}</span> очков
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div>❤️ HP: <span className="text-green-400">{stats.hp}</span></div>
        <div>⚔️ ATK: <span className="text-red-400">{stats.atk}</span></div>
        <div>🛡️ Броня: <span className="text-blue-400">{stats.armor}</span></div>
        <div>👟 Скорость: <span className="text-cyan-400">{stats.speed}</span></div>
        <div>⚡ Инициатива: <span className="text-purple-400">{stats.initiative}</span></div>
        <div>💨 Уклонение: <span className="text-gray-300">{stats.dodge}%</span></div>
        <div>🎯 Дальность: <span className="text-orange-400">{stats.range}</span></div>
        <div>🗡️ Атак: <span className="text-pink-400">{stats.atkCount}</span></div>
      </div>
      
      {abilities.length > 0 && (
        <div className="border-t border-gray-600 pt-2">
          <div className="text-xs text-gray-400 mb-1">Способности:</div>
          <div className="space-y-1">
            {abilities.map((ability, index) => (
              <div key={index} className="text-xs text-blue-300">
                ✨ {ability}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Tooltip content={content} placement={placement} theme="dark" interactive>
      {children}
    </Tooltip>
  );
}

/**
 * Props for AbilityTooltip component.
 */
interface AbilityTooltipProps {
  /** Ability name */
  name: string;
  /** Ability description */
  description: string;
  /** Ability type */
  type: 'active' | 'passive';
  /** Cooldown in turns (for active abilities) */
  cooldown?: number;
  /** Current cooldown remaining */
  currentCooldown?: number;
  /** Damage or effect value */
  value?: number;
  /** Target type */
  targetType?: string;
  /** Tooltip placement */
  placement?: TooltipPlacement;
  /** Children to wrap */
  children: ReactNode;
}

/**
 * Specialized tooltip for displaying ability information.
 * 
 * @param props - AbilityTooltip props
 * @returns Ability tooltip component
 * @example
 * <AbilityTooltip
 *   name="Fireball"
 *   description="Deals fire damage to target"
 *   type="active"
 *   cooldown={3}
 *   value={50}
 * >
 *   <AbilityIcon ability={fireball} />
 * </AbilityTooltip>
 */
export function AbilityTooltip({
  name,
  description,
  type,
  cooldown,
  currentCooldown,
  value,
  targetType,
  placement = 'top',
  children,
}: AbilityTooltipProps) {
  const content = (
    <div className="space-y-2 min-w-[180px]">
      <div className="flex items-center justify-between">
        <span className="font-bold text-blue-300">{name}</span>
        <span className={`text-xs px-2 py-0.5 rounded ${
          type === 'active' ? 'bg-blue-800 text-blue-200' : 'bg-purple-800 text-purple-200'
        }`}>
          {type === 'active' ? 'Активная' : 'Пассивная'}
        </span>
      </div>
      
      <p className="text-xs text-gray-300">{description}</p>
      
      <div className="flex flex-wrap gap-2 text-xs">
        {value !== undefined && (
          <span className="bg-gray-700 px-2 py-0.5 rounded">
            💥 {value}
          </span>
        )}
        {cooldown !== undefined && (
          <span className="bg-gray-700 px-2 py-0.5 rounded">
            ⏱️ {cooldown} ход{cooldown > 1 ? 'а' : ''}
          </span>
        )}
        {targetType && (
          <span className="bg-gray-700 px-2 py-0.5 rounded">
            🎯 {targetType}
          </span>
        )}
      </div>
      
      {currentCooldown !== undefined && currentCooldown > 0 && (
        <div className="text-xs text-yellow-400">
          ⏳ Перезарядка: {currentCooldown} ход{currentCooldown > 1 ? 'а' : ''}
        </div>
      )}
    </div>
  );

  return (
    <Tooltip content={content} placement={placement} theme="info">
      {children}
    </Tooltip>
  );
}

/**
 * Props for StatTooltip component.
 */
interface StatTooltipProps {
  /** Stat name */
  name: string;
  /** Stat value */
  value: number | string;
  /** Stat description */
  description: string;
  /** Optional bonus value */
  bonus?: number;
  /** Tooltip placement */
  placement?: TooltipPlacement;
  /** Children to wrap */
  children: ReactNode;
}

/**
 * Specialized tooltip for displaying stat information.
 * 
 * @param props - StatTooltip props
 * @returns Stat tooltip component
 * @example
 * <StatTooltip
 *   name="Attack"
 *   value={25}
 *   description="Base damage dealt per attack"
 *   bonus={5}
 * >
 *   <span>ATK: 25</span>
 * </StatTooltip>
 */
export function StatTooltip({
  name,
  value,
  description,
  bonus,
  placement = 'top',
  children,
}: StatTooltipProps) {
  const content = (
    <div className="space-y-1 min-w-[150px]">
      <div className="font-bold text-white">{name}</div>
      <div className="text-lg text-yellow-400">
        {value}
        {bonus !== undefined && bonus !== 0 && (
          <span className={bonus > 0 ? 'text-green-400' : 'text-red-400'}>
            {' '}({bonus > 0 ? '+' : ''}{bonus})
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
  );

  return (
    <Tooltip content={content} placement={placement} theme="dark">
      {children}
    </Tooltip>
  );
}

/**
 * Props for InfoTooltip component.
 */
interface InfoTooltipProps {
  /** Tooltip content */
  content: ReactNode;
  /** Icon to display */
  icon?: string;
  /** Icon size */
  size?: 'sm' | 'md' | 'lg';
  /** Tooltip placement */
  placement?: TooltipPlacement;
  /** Theme variant */
  theme?: TooltipTheme;
}

/**
 * Info icon with tooltip for contextual help.
 * 
 * @param props - InfoTooltip props
 * @returns Info tooltip component
 * @example
 * <InfoTooltip content="This is helpful information" />
 */
export function InfoTooltip({
  content,
  icon = 'ℹ️',
  size = 'md',
  placement = 'top',
  theme = 'info',
}: InfoTooltipProps) {
  const sizeClasses = {
    sm: 'text-xs w-4 h-4',
    md: 'text-sm w-5 h-5',
    lg: 'text-base w-6 h-6',
  };

  return (
    <Tooltip content={content} placement={placement} theme={theme}>
      <span
        className={`
          inline-flex items-center justify-center rounded-full
          bg-gray-700 hover:bg-gray-600 cursor-help transition-colors
          ${sizeClasses[size]}
        `}
        aria-label="More information"
      >
        {icon}
      </span>
    </Tooltip>
  );
}


// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

/**
 * Props for TooltipProvider component.
 */
interface TooltipProviderProps {
  /** Child components */
  children: ReactNode;
  /** Default show delay for all tooltips */
  defaultDelay?: number;
  /** Default theme for all tooltips */
  defaultTheme?: TooltipTheme;
}

/**
 * Provider component for global tooltip configuration.
 * 
 * @param props - Provider props
 * @returns Provider component
 * @example
 * <TooltipProvider defaultDelay={200} defaultTheme="dark">
 *   <App />
 * </TooltipProvider>
 */
export function TooltipProvider({
  children,
  defaultDelay = DEFAULT_SHOW_DELAY,
  defaultTheme = 'dark',
}: TooltipProviderProps) {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalContainer(document.body);
  }, []);

  return (
    <TooltipContext.Provider
      value={{
        defaultDelay,
        defaultTheme,
        portalContainer,
      }}
    >
      {children}
    </TooltipContext.Provider>
  );
}

// =============================================================================
// HOOK FOR PROGRAMMATIC TOOLTIPS
// =============================================================================

/**
 * Hook for programmatic tooltip control.
 * 
 * @returns Functions to show/hide tooltips programmatically
 * @example
 * const { showTooltip, hideTooltip } = useTooltip();
 * 
 * // Show tooltip on element
 * showTooltip(elementRef.current, 'Tooltip content');
 */
export function useTooltip() {
  const [activeTooltip, setActiveTooltip] = useState<{
    element: HTMLElement;
    content: ReactNode;
    placement?: TooltipPlacement;
  } | null>(null);

  const showTooltip = useCallback((
    element: HTMLElement,
    content: ReactNode,
    placement?: TooltipPlacement
  ) => {
    setActiveTooltip({ element, content, placement });
  }, []);

  const hideTooltip = useCallback(() => {
    setActiveTooltip(null);
  }, []);

  return {
    activeTooltip,
    showTooltip,
    hideTooltip,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  TooltipProps,
  TooltipPlacement,
  TooltipTrigger,
  TooltipTheme,
  UnitTooltipProps,
  AbilityTooltipProps,
  StatTooltipProps,
  InfoTooltipProps,
  TooltipProviderProps,
};

export default Tooltip;