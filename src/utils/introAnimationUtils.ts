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
 * Force clear any intro animation state on application startup
 * This is called when the application initializes to ensure fresh experience
 */
export const initializeFreshIntroExperience = (): void => {
  console.log('🎬 Initializing fresh intro experience...');

  // Clear all existing flags
  clearAllIntroAnimationFlags();

  // Also clear any other potential animation-related flags
  try {
    const allKeys = Object.keys(localStorage);
    const animationKeys = allKeys.filter(key =>
      key.includes('intro') ||
      key.includes('animation') ||
      key.includes('seen')
    );

    animationKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log(`🧹 Cleared ${animationKeys.length} animation-related flags`);
  } catch (error) {
    console.error('Error during comprehensive cleanup:', error);
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
 */
export const setupGlobalIntroListeners = (): void => {
  // Clear flags on page load/refresh
  window.addEventListener('load', () => {
    console.log('🎬 Page loaded - Ensuring fresh intro experience');
    initializeFreshIntroExperience();
  });

  // Clear flags on page visibility change (when user returns to tab)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      console.log('🎬 Page became visible - Ensuring fresh intro experience');
      initializeFreshIntroExperience();
    }
  });

  // Clear flags on focus (when user clicks on window)
  window.addEventListener('focus', () => {
    console.log('🎬 Window focused - Ensuring fresh intro experience');
    initializeFreshIntroExperience();
  });
};
