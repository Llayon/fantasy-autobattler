/**
 * Player Profile page for Fantasy Autobattler.
 * Displays player information, statistics, teams, and settings.
 * 
 * @fileoverview Profile page wrapper with dynamic import for SSR safety.
 */

'use client';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

import dynamicImport from 'next/dynamic';
import { FullPageLoader } from '@/components/LoadingStates';

// Force dynamic rendering to avoid SSR issues with browser APIs
// Note: Using 'force-dynamic' ensures the page is rendered at request time

/**
 * Dynamically imported ProfilePageContent component.
 * Uses SSR: false to prevent server-side rendering issues with browser APIs.
 */
const ProfilePageContent = dynamicImport(
  () => import('./ProfilePageContent'),
  { 
    ssr: false,
    loading: () => <FullPageLoader message="Загрузка профиля..." icon="👤" />
  }
);

/**
 * Player Profile page component.
 * Displays comprehensive player information including stats, teams, and settings.
 * 
 * @returns Player profile page
 * @example
 * <ProfilePage />
 */
export default function ProfilePage() {
  return <ProfilePageContent />;
}
