/**
 * Navigation component for Fantasy Autobattler.
 * Provides responsive navigation with tabs for all main sections.
 * 
 * @fileoverview Universal navigation component with mobile/desktop layouts.
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';

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
  /** Whether to show badge */
  showBadge?: boolean;
  /** Badge count (optional) */
  badgeCount?: number;
}

/**
 * Navigation component props.
 */
interface NavigationProps {
  /** Additional CSS classes */
  className?: string;
  /** Whether to show as mobile layout */
  isMobile?: boolean;
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
  },
  {
    id: 'battle',
    label: 'Бой',
    icon: '🎮',
    href: '/battle',
  },
  {
    id: 'history',
    label: 'История',
    icon: '📚',
    href: '/history',
  },
  {
    id: 'profile',
    label: 'Профиль',
    icon: '👤',
    href: '/profile',
  },
];

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

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Navigation tab component.
 */
function NavigationTabComponent({
  tab,
  isActive,
  isMobile = false,
}: {
  tab: NavigationTab;
  isActive: boolean;
  isMobile?: boolean;
}) {
  const baseClasses = `
    relative flex items-center justify-center gap-2 px-4 py-3 rounded-lg
    font-medium transition-all duration-200 hover:scale-105
    ${isMobile ? 'flex-col text-xs' : 'flex-row text-sm'}
  `;

  const activeClasses = isActive
    ? 'bg-blue-600 text-white shadow-lg'
    : 'text-gray-300 hover:text-white hover:bg-gray-700';

  return (
    <Link href={tab.href} className={`${baseClasses} ${activeClasses}`}>
      <span className={`${isMobile ? 'text-lg' : 'text-base'}`}>
        {tab.icon}
      </span>
      <span className={isMobile ? 'mt-1' : ''}>{tab.label}</span>
      
      {/* Badge for notifications */}
      {tab.showBadge && tab.badgeCount && tab.badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {tab.badgeCount > 9 ? '9+' : tab.badgeCount}
        </span>
      )}
    </Link>
  );
}

/**
 * Desktop navigation component.
 */
function DesktopNavigation({ tabs }: { tabs: NavigationTab[] }) {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm rounded-lg p-2">
      {tabs.map((tab) => (
        <NavigationTabComponent
          key={tab.id}
          tab={tab}
          isActive={isTabActive(tab.href, pathname)}
          isMobile={false}
        />
      ))}
    </nav>
  );
}

/**
 * Mobile navigation component.
 */
function MobileNavigation({ tabs }: { tabs: NavigationTab[] }) {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-800/95 backdrop-blur-sm border-t border-gray-700">
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
 * Main Navigation component with responsive design.
 * Automatically switches between desktop and mobile layouts.
 * 
 * @param props - Navigation component props
 * @returns Navigation component
 * @example
 * <Navigation />
 */
export function Navigation({ className = '', isMobile }: NavigationProps) {
  const [tabs, setTabs] = useState<NavigationTab[]>(NAVIGATION_TABS);
  const [loading, setLoading] = useState(true);

  /**
   * Load unviewed battles count for history badge.
   */
  const loadBadgeData = async () => {
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
  };

  // Load badge data on mount
  useEffect(() => {
    loadBadgeData();
  }, []);

  // Don't render until badge data is loaded (prevents flash)
  if (loading) {
    return null;
  }

  return (
    <div className={className}>
      {/* Desktop Navigation */}
      <DesktopNavigation tabs={tabs} />
      
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
 * @returns Wrapped content with proper spacing
 * @example
 * <NavigationWrapper>
 *   <div>Page content</div>
 * </NavigationWrapper>
 */
export function NavigationWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-20 md:pb-0">
      {children}
    </div>
  );
}

/**
 * Hook to get current navigation state.
 * 
 * @returns Current active tab and navigation utilities
 * @example
 * const { activeTab, isActive } = useNavigation();
 */
export function useNavigation() {
  const pathname = usePathname();
  
  const activeTab = NAVIGATION_TABS.find(tab => 
    isTabActive(tab.href, pathname)
  );

  const isActive = (href: string) => isTabActive(href, pathname);

  return {
    activeTab,
    isActive,
    tabs: NAVIGATION_TABS,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default Navigation;
export type { NavigationProps, NavigationTab };