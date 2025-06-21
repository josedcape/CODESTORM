/**
 * Utility functions for managing intro animation state
 * Ensures that intro animations are always shown for a fresh user experience
 */

/**
 * Clear all intro animation related localStorage flags
 * This ensures that the intro animation will always play
 */
export const clearAllIntroAnimationFlags = (): void => {
  try {
    // List of all possible intro animation localStorage keys
    const introKeys = [
      'codestorm-intro-seen',
      'codestorm-intro-seen-home',
      'codestorm-intro-seen-menu',
      'codestorm-intro-seen-constructor',
      'codestorm-intro-seen-main'
    ];

    // Remove all intro animation flags
    introKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log('🧹 All intro animation flags cleared - Fresh experience guaranteed!');
  } catch (error) {
    console.error('Error clearing intro animation flags:', error);
  }
};

/**
 * Initialize intro experience - only clears flags if not already initialized this session
 * This prevents infinite loops while ensuring fresh experience on first load
 */
export const initializeFreshIntroExperience = (): void => {
  const sessionKey = 'codestorm-intro-initialized-session';
  const sessionId = sessionStorage.getItem(sessionKey);
  const currentSession = Date.now().toString();

  // Only clear flags if this is a new session
  if (!sessionId || sessionId !== currentSession) {
    console.log('🎬 Initializing fresh intro experience for new session...');

    // Clear all existing flags
    clearAllIntroAnimationFlags();

    // Mark this session as initialized
    sessionStorage.setItem(sessionKey, currentSession);

    console.log('🧹 Intro flags cleared for new session');
  } else {
    console.log('🎬 Intro already initialized for this session, skipping cleanup');
  }
};

/**
 * Check if we should show intro animation (always returns true now)
 * @param pageKey - The page identifier
 * @returns Always true to ensure animation shows
 */
export const shouldShowIntroAnimation = (pageKey?: string): boolean => {
  console.log(`🎬 Checking intro animation for ${pageKey || 'default'} - Always showing!`);
  return true;
};

/**
 * Log intro animation status for debugging
 * @param pageKey - The page identifier
 * @param action - The action being performed
 */
export const logIntroAnimationStatus = (pageKey: string, action: string): void => {
  console.log(`🎬 [${pageKey.toUpperCase()}] ${action}`);
};

/**
 * Set up global event listeners to ensure fresh intro experience
 * This ensures animations show even after page refreshes or navigation
 * DISABLED to prevent infinite loops
 */
export const setupGlobalIntroListeners = (): void => {
  console.log('🎬 Global intro listeners setup disabled to prevent loops');
  // Listeners disabled to prevent infinite navigation loops
  // The intro will be managed by the useIntroAnimation hook instead
};
