/**
 * Enhanced Navigation component for Fantasy Autobattler.
 * Features mobile bottom tab bar, desktop top navigation, breadcrumbs, and keyboard shortcuts.
 * 
 * @fileoverview Complete navigation system with responsive design and accessibility features.
 */

'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { usePlayerStore, selectPlayer } from '@/store/playerStore';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Navigation tab configuration.
 */
interface NavigationTab {
  /** Tab identifier */
  id: string;
  /** Display label */
  label: string;
  /** Tab icon emoji */
  icon: string;
  /** Navigation path */
  href: string;
  /** Keyboard shortcut number (1-4) */
  shortcut: number;
  /** Whether to show badge */
  showBadge?: boolean;
  /** Badge count (optional) */
  badgeCount?: number;
}

/**
 * Breadcrumb item configuration.
 */
interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Navigation path (optional for current page) */
  href?: string;
  /** Item icon (optional) */
  icon?: string;
}

/**
 * Navigation component props.
 */
interface NavigationProps {
  /** Additional CSS classes */
  className?: string;
  /** Whether to show as mobile layout */
  isMobile?: boolean;
  /** Custom breadcrumbs for nested pages */
  breadcrumbs?: BreadcrumbItem[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Navigation tabs configuration */
const NAVIGATION_TABS: NavigationTab[] = [
  {
    id: 'team-builder',
    label: 'Команда',
    icon: '⚔️',
    href: '/',
    shortcut: 1,
  },
  {
    id: 'battle',
    label: 'Бой',
    icon: '🎮',
    href: '/battle',
    shortcut: 2,
  },
  {
    id: 'history',
    label: 'История',
    icon: '📚',
    href: '/history',
    shortcut: 3,
  },
  {
    id: 'profile',
    label: 'Профиль',
    icon: '👤',
    href: '/profile',
    shortcut: 4,
  },
];

/** Logo configuration */
const LOGO_CONFIG = {
  text: '🎮 Fantasy Autobattler',
  shortText: '🎮 FA',
  href: '/',
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if tab is currently active based on pathname.
 * 
 * @param tabHref - Tab href to check
 * @param pathname - Current pathname
 * @returns True if tab is active
 * @example
 * const isActive = isTabActive('/profile', '/profile');
 */
function isTabActive(tabHref: string, pathname: string): boolean {
  if (tabHref === '/') {
    return pathname === '/';
  }
  return pathname.startsWith(tabHref);
}

/**
 * Get unviewed battles count for badge display.
 * This is a simplified implementation - in a real app you'd track viewed status.
 * 
 * @returns Promise resolving to unviewed battles count
 * @example
 * const count = await getUnviewedBattlesCount();
 */
async function getUnviewedBattlesCount(): Promise<number> {
  try {
    const response = await api.getBattles();
    // For demo purposes, assume last 3 battles are unviewed
    // In real implementation, you'd track viewed status per battle
    return Math.min(response.battles.length, 3);
  } catch (error) {
    // If API fails, don't show badge
    return 0;
  }
}

/**
 * Generate breadcrumbs based on current pathname.
 * 
 * @param pathname - Current pathname
 * @returns Array of breadcrumb items
 * @example
 * const breadcrumbs = generateBreadcrumbs('/battle/123');
 */
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length === 0) {
    return [{ label: 'Команда', icon: '⚔️' }];
  }
  
  const breadcrumbs: BreadcrumbItem[] = [];
  
  // Add base page
  if (segments[0] === 'history') {
    breadcrumbs.push({ label: 'История', href: '/history', icon: '📚' });
    
    // Add battle replay if viewing specific battle
    if (segments.length > 1) {
      breadcrumbs.push({ label: `Повтор боя #${segments[1]}`, icon: '▶️' });
    }
  } else if (segments[0] === 'profile') {
    breadcrumbs.push({ label: 'Профиль', href: '/profile', icon: '👤' });
    
    // Add edit page if editing
    if (segments[1] === 'edit') {
      breadcrumbs.push({ label: 'Редактирование', icon: '✏️' });
    }
  } else if (segments[0] === 'battle') {
    if (segments.length > 1) {
      // Battle replay
      breadcrumbs.push({ label: 'История', href: '/history', icon: '📚' });
      breadcrumbs.push({ label: `Повтор боя #${segments[1]}`, icon: '▶️' });
    } else {
      // Battle page
      breadcrumbs.push({ label: 'Бой', icon: '🎮' });
    }
  } else {
    // Default to team builder
    breadcrumbs.push({ label: 'Команда', icon: '⚔️' });
  }
  
  return breadcrumbs;
}

/**
 * Get player avatar URL using Boring Avatars API.
 * 
 * @param playerId - Player ID for consistent avatar
 * @param size - Avatar size in pixels
 * @returns Avatar URL
 * @example
 * const avatarUrl = getPlayerAvatar('player-123', 32);
 */
function getPlayerAvatar(playerId: string, size: number = 32): string {
  const styles = ['marble', 'beam', 'pixel', 'sunset', 'ring'];
  const style = styles[Math.abs(playerId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % styles.length];
  return `https://source.boringavatars.com/${style}/${size}/${encodeURIComponent(playerId)}?colors=264653,2a9d8f,e9c46a,f4a261,e76f51`;
}

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Logo component for desktop navigation.
 */
function Logo({ className = '' }: { className?: string }) {
  return (
    <Link 
      href={LOGO_CONFIG.href}
      className={`flex items-center gap-2 font-bold text-yellow-400 hover:text-yellow-300 transition-colors ${className}`}
      title="Перейти на главную"
    >
      <span className="text-xl">{LOGO_CONFIG.text.split(' ')[0]}</span>
      <span className="hidden lg:inline">{LOGO_CONFIG.text.split(' ').slice(1).join(' ')}</span>
      <span className="lg:hidden">{LOGO_CONFIG.shortText.split(' ').slice(1).join(' ')}</span>
    </Link>
  );
}

/**
 * Player profile component for desktop navigation.
 */
function PlayerProfile({ className = '' }: { className?: string }) {
  const player = usePlayerStore(selectPlayer);
  
  if (!player) {
    return (
      <div className={`flex items-center gap-2 text-gray-400 ${className}`}>
        <div className="w-8 h-8 bg-gray-600 rounded-full animate-pulse" />
        <span className="hidden lg:inline">Загрузка...</span>
      </div>
    );
  }
  
  const avatarUrl = getPlayerAvatar(player.id, 32);
  
  return (
    <Link 
      href="/profile"
      className={`flex items-center gap-2 text-gray-300 hover:text-white transition-colors ${className}`}
      title="Перейти в профиль"
    >
      <img 
        src={avatarUrl} 
        alt={`Аватар ${player.name}`}
        className="w-8 h-8 rounded-full border-2 border-gray-600 hover:border-gray-400 transition-colors"
        loading="lazy"
      />
      <span className="hidden lg:inline font-medium">{player.name}</span>
    </Link>
  );
}

/**
 * Breadcrumbs component for nested pages.
 */
function Breadcrumbs({ 
  items, 
  className = '' 
}: { 
  items: BreadcrumbItem[];
  className?: string;
}) {
  if (items.length <= 1) return null;
  
  return (
    <nav className={`flex items-center gap-2 text-sm text-gray-400 ${className}`} aria-label="Breadcrumb">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && (
            <span className="text-gray-600">→</span>
          )}
          {item.href ? (
            <Link 
              href={item.href}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              {item.icon && <span>{item.icon}</span>}
              <span>{item.label}</span>
            </Link>
          ) : (
            <span className="flex items-center gap-1 text-white font-medium">
              {item.icon && <span>{item.icon}</span>}
              <span>{item.label}</span>
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

/**
 * Navigation tab component with keyboard shortcut support.
 */
function NavigationTabComponent({
  tab,
  isActive,
  isMobile = false,
  showTooltip = false,
}: {
  tab: NavigationTab;
  isActive: boolean;
  isMobile?: boolean;
  showTooltip?: boolean;
}) {
  const baseClasses = `
    relative flex items-center justify-center gap-2 rounded-lg
    font-medium transition-all duration-200 hover:scale-105 active:scale-95
    touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500
    ${isMobile 
      ? 'flex-col text-xs px-2 py-2 min-h-[64px] min-w-[64px]' 
      : 'flex-row text-sm px-4 py-3 min-h-[44px]'
    }
  `;

  const activeClasses = isActive
    ? 'bg-blue-600 text-white shadow-lg'
    : 'text-gray-300 hover:text-white hover:bg-gray-700';

  const tooltipText = showTooltip ? `${tab.label} (${tab.shortcut})` : undefined;

  return (
    <Link 
      href={tab.href} 
      className={`${baseClasses} ${activeClasses}`}
      title={tooltipText}
      aria-label={`${tab.label} (клавиша ${tab.shortcut})`}
    >
      <span className={`${isMobile ? 'text-lg' : 'text-base'}`}>
        {tab.icon}
      </span>
      <span className={isMobile ? 'mt-1' : ''}>{tab.label}</span>
      
      {/* Keyboard shortcut indicator for desktop */}
      {!isMobile && showTooltip && (
        <span className="absolute -top-1 -right-1 bg-gray-600 text-white text-xs rounded w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {tab.shortcut}
        </span>
      )}
      
      {/* Badge for notifications */}
      {tab.showBadge && tab.badgeCount && tab.badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
          {tab.badgeCount > 9 ? '9+' : tab.badgeCount}
        </span>
      )}
    </Link>
  );
}

/**
 * Desktop top navigation component with logo, tabs, and profile.
 */
function DesktopNavigation({ 
  tabs, 
  breadcrumbs 
}: { 
  tabs: NavigationTab[];
  breadcrumbs: BreadcrumbItem[];
}) {
  const pathname = usePathname();

  return (
    <header className="hidden md:block bg-gray-800/95 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main navigation bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo />
          
          {/* Center tabs */}
          <nav className="flex items-center gap-2 bg-gray-700/50 rounded-lg p-2 group">
            {tabs.map((tab) => (
              <NavigationTabComponent
                key={tab.id}
                tab={tab}
                isActive={isTabActive(tab.href, pathname)}
                isMobile={false}
                showTooltip={true}
              />
            ))}
          </nav>
          
          {/* Profile */}
          <PlayerProfile />
        </div>
        
        {/* Breadcrumbs */}
        {breadcrumbs.length > 1 && (
          <div className="pb-3">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}
      </div>
    </header>
  );
}

/**
 * Mobile bottom tab bar navigation component.
 */
function MobileNavigation({ tabs }: { tabs: NavigationTab[] }) {
  const pathname = usePathname();

  return (
    <nav 
      className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-800/95 backdrop-blur-sm border-t border-gray-700"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => (
          <NavigationTabComponent
            key={tab.id}
            tab={tab}
            isActive={isTabActive(tab.href, pathname)}
            isMobile={true}
          />
        ))}
      </div>
    </nav>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Enhanced Navigation component with responsive design, breadcrumbs, and keyboard shortcuts.
 * Features mobile bottom tab bar, desktop top navigation, and accessibility support.
 * 
 * @param props - Navigation component props
 * @returns Navigation component
 * @example
 * <Navigation />
 * 
 * @example
 * // With custom breadcrumbs
 * <Navigation breadcrumbs={[
 *   { label: 'История', href: '/history', icon: '📚' },
 *   { label: 'Повтор боя #123', icon: '▶️' }
 * ]} />
 */
export function Navigation({ 
  className = '', 
  breadcrumbs: customBreadcrumbs 
}: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [tabs, setTabs] = useState<NavigationTab[]>(NAVIGATION_TABS);
  const [loading, setLoading] = useState(true);

  // Generate breadcrumbs from pathname or use custom ones
  const breadcrumbs = customBreadcrumbs || generateBreadcrumbs(pathname);

  /**
   * Handle keyboard shortcuts for tab navigation.
   * 
   * @param event - Keyboard event
   */
  const handleKeyboardShortcuts = useCallback((event: KeyboardEvent) => {
    // Only handle shortcuts when not typing in input fields
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as HTMLElement)?.contentEditable === 'true'
    ) {
      return;
    }

    // Handle number keys 1-4 for tab navigation
    const key = event.key;
    if (['1', '2', '3', '4'].includes(key)) {
      event.preventDefault();
      const shortcut = parseInt(key, 10);
      const tab = NAVIGATION_TABS.find(t => t.shortcut === shortcut);
      if (tab) {
        router.push(tab.href);
      }
    }
  }, [router]);

  /**
   * Load unviewed battles count for history badge.
   */
  const loadBadgeData = useCallback(async () => {
    try {
      const unviewedCount = await getUnviewedBattlesCount();
      
      setTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === 'history' 
            ? { 
                ...tab, 
                showBadge: unviewedCount > 0,
                badgeCount: unviewedCount 
              }
            : tab
        )
      );
    } catch (error) {
      // Silently handle errors - navigation should work without badges
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up keyboard shortcuts
  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  }, [handleKeyboardShortcuts]);

  // Load badge data on mount
  useEffect(() => {
    loadBadgeData();
  }, [loadBadgeData]);

  // Don't render until badge data is loaded (prevents flash)
  if (loading) {
    return null;
  }

  return (
    <div className={className}>
      {/* Desktop Navigation */}
      <DesktopNavigation tabs={tabs} breadcrumbs={breadcrumbs} />
      
      {/* Mobile Navigation */}
      <MobileNavigation tabs={tabs} />
    </div>
  );
}

/**
 * Navigation wrapper for pages that need bottom padding on mobile.
 * Use this to wrap page content when using mobile navigation.
 * 
 * @param children - Page content
 * @returns Wrapped content with proper spacing for mobile bottom tab bar
 * @example
 * <NavigationWrapper>
 *   <div>Page content</div>
 * </NavigationWrapper>
 */
export function NavigationWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-20 sm:pb-0">
      {children}
    </div>
  );
}

/**
 * Hook to get current navigation state and utilities.
 * 
 * @returns Current active tab, navigation utilities, and breadcrumbs
 * @example
 * const { activeTab, isActive, breadcrumbs } = useNavigation();
 */
export function useNavigation() {
  const pathname = usePathname();
  
  const activeTab = NAVIGATION_TABS.find(tab => 
    isTabActive(tab.href, pathname)
  );

  const isActive = (href: string) => isTabActive(href, pathname);
  
  const breadcrumbs = generateBreadcrumbs(pathname);

  return {
    activeTab,
    isActive,
    breadcrumbs,
    tabs: NAVIGATION_TABS,
  };
}

/**
 * Hook for keyboard navigation shortcuts.
 * Provides utilities for programmatic navigation.
 * 
 * @returns Navigation functions
 * @example
 * const { navigateToTab, navigateToHome } = useKeyboardNavigation();
 */
export function useKeyboardNavigation() {
  const router = useRouter();
  
  /**
   * Navigate to tab by shortcut number.
   * 
   * @param shortcut - Tab shortcut number (1-4)
   * @example
   * navigateToTab(1); // Navigate to team builder
   */
  const navigateToTab = useCallback((shortcut: number) => {
    const tab = NAVIGATION_TABS.find(t => t.shortcut === shortcut);
    if (tab) {
      router.push(tab.href);
    }
  }, [router]);
  
  /**
   * Navigate to home page.
   * 
   * @example
   * navigateToHome();
   */
  const navigateToHome = useCallback(() => {
    router.push('/');
  }, [router]);
  
  return {
    navigateToTab,
    navigateToHome,
    shortcuts: NAVIGATION_TABS.map(tab => ({
      key: tab.shortcut,
      label: tab.label,
      href: tab.href,
    })),
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default Navigation;
export type { NavigationProps, NavigationTab, BreadcrumbItem };