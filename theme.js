// ============================================================
// MASTER THEME CONTROLLER - HKDMservices
// Single tap: toggle manual theme + show hint for 5 seconds
// Double tap: re-enable auto mode (time-based)
// ============================================================
(function() {
    'use strict';

    // ============================================================
    // CONFIGURATION
    // ============================================================
    const STORAGE_KEY = 'hkdmservices_theme';
    const AUTO_MODE_KEY = 'hkdmservices_theme_auto';
    const DARK_HOUR_START = 18; // 6 PM
    const DARK_HOUR_END = 6;    // 6 AM
    const HINT_DURATION = 5000; // 5 seconds

    const html = document.documentElement;

    // ============================================================
    // THEME HELPERS
    // ============================================================
    function getTimeBasedTheme() {
        const hour = new Date().getHours();
        return (hour >= DARK_HOUR_START || hour < DARK_HOUR_END) ? 'dark' : 'light';
    }

    function applyTheme(theme, isAuto) {
        html.setAttribute('data-theme', theme);

        // Update all theme icons on the page
        document.querySelectorAll('.theme-icon, #themeIcon, #masterThemeIcon').forEach(icon => {
            icon.className = theme === 'dark'
                ? 'bi bi-sun-fill theme-icon'
                : 'bi bi-moon-stars-fill theme-icon';
        });

        // Update auto indicators
        document.querySelectorAll('.auto-indicator').forEach(indicator => {
            indicator.style.display = isAuto ? 'flex' : 'none';
        });

        // Save to localStorage
        try {
            localStorage.setItem(STORAGE_KEY, theme);
            localStorage.setItem(AUTO_MODE_KEY, isAuto ? 'true' : 'false');
        } catch (e) {}

        // Dispatch event so page scripts can react
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: theme, isAuto: isAuto }
        }));

        console.log(`🎨 Theme: ${theme} (${isAuto ? 'Auto' : 'Manual'})`);
    }

    function getCurrentTheme() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const autoMode = localStorage.getItem(AUTO_MODE_KEY) !== 'false';

            if (autoMode) {
                return { theme: getTimeBasedTheme(), isAuto: true };
            }
            if (saved === 'dark' || saved === 'light') {
                return { theme: saved, isAuto: false };
            }
            return { theme: getTimeBasedTheme(), isAuto: true };
        } catch (e) {
            return { theme: getTimeBasedTheme(), isAuto: true };
        }
    }

    // ============================================================
    // HINT TOAST — "Double tap for Auto switch"
    // Shows for 5 seconds on single tap
    // ============================================================
    let hintTimeout = null;
    let hintElement = null;

    function showAutoHint() {
        // Remove existing hint if any
        if (hintElement) {
            hintElement.remove();
            hintElement = null;
        }
        if (hintTimeout) {
            clearTimeout(hintTimeout);
            hintTimeout = null;
        }

        // Build hint element
        hintElement = document.createElement('div');
        hintElement.className = 'theme-hint-toast';
        hintElement.innerHTML = '👆👆 Double tap for Auto switch';

        // Base styles
        hintElement.style.cssText = `
            position: fixed;
            bottom: 90px;
            right: 20px;
            z-index: 99999;
            background: #161b22;
            color: #f1f3f5;
            border: 1px solid #30363d;
            border-radius: 10px;
            padding: 12px 18px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 6px 20px rgba(0,0,0,0.35);
            max-width: 280px;
            font-family: system-ui, -apple-system, sans-serif;
            opacity: 0;
            transform: translateY(10px);
            transition: opacity 0.3s ease, transform 0.3s ease;
            pointer-events: none;
            user-select: none;
        `;

        // Light mode variant
        if (document.documentElement.getAttribute('data-theme') !== 'dark') {
            hintElement.style.background = '#ffffff';
            hintElement.style.color = '#212529';
            hintElement.style.borderColor = '#dee2e6';
            hintElement.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
        }

        document.body.appendChild(hintElement);

        // Animate in
        requestAnimationFrame(() => {
            hintElement.style.opacity = '1';
            hintElement.style.transform = 'translateY(0)';
        });

        // Auto-dismiss after 5 seconds
        hintTimeout = setTimeout(() => {
            if (!hintElement) return;
            hintElement.style.opacity = '0';
            hintElement.style.transform = 'translateY(10px)';
            setTimeout(() => {
                if (hintElement) {
                    hintElement.remove();
                    hintElement = null;
                }
            }, 300);
        }, HINT_DURATION);
    }

    // ============================================================
    // PUBLIC API (exposed globally)
    // ============================================================
    window.toggleTheme = function() {
        const current = getCurrentTheme();
        if (current.isAuto) {
            const timeTheme = getTimeBasedTheme();
            const newTheme = timeTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme, false);
        } else {
            const newTheme = current.theme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme, false);
        }
    };

    window.enableAutoTheme = function() {
        const timeTheme = getTimeBasedTheme();
        applyTheme(timeTheme, true);
    };

    // Expose hint so pages can trigger it if needed
    window.showThemeAutoHint = showAutoHint;

    // ============================================================
    // AUTO-SWITCH TIMER
    // ============================================================
    function startAutoSwitch() {
        // Check every minute
        setInterval(() => {
            const current = getCurrentTheme();
            if (current.isAuto) {
                const timeTheme = getTimeBasedTheme();
                if (timeTheme !== html.getAttribute('data-theme')) {
                    applyTheme(timeTheme, true);
                }
            }
        }, 60000);

        // Re-check when user returns to the tab
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                const current = getCurrentTheme();
                if (current.isAuto) {
                    const timeTheme = getTimeBasedTheme();
                    if (timeTheme !== html.getAttribute('data-theme')) {
                        applyTheme(timeTheme, true);
                    }
                }
            }
        });
    }

    // ============================================================
    // INIT
    // ============================================================
    function init() {
        const { theme, isAuto } = getCurrentTheme();
        applyTheme(theme, isAuto);
        startAutoSwitch();
        console.log('✅ Master theme controller initialized.');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
