// ============================================================
// MASTER THEME CONTROLLER - HKDMservices
// Works on iPhone Chrome + Safari, Android, Desktop
// ============================================================
(function() {
    'use strict';

    const STORAGE_KEY = 'hkdmservices_theme';
    const AUTO_MODE_KEY = 'hkdmservices_theme_auto';
    const DARK_HOUR_START = 18;
    const DARK_HOUR_END = 6;
    const HINT_DURATION = 5000;

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

        document.querySelectorAll('.theme-icon, #themeIcon, #masterThemeIcon').forEach(icon => {
            icon.className = theme === 'dark'
                ? 'bi bi-sun-fill theme-icon'
                : 'bi bi-moon-stars-fill theme-icon';
        });

        document.querySelectorAll('.auto-indicator').forEach(indicator => {
            indicator.style.display = isAuto ? 'flex' : 'none';
        });

        try {
            localStorage.setItem(STORAGE_KEY, theme);
            localStorage.setItem(AUTO_MODE_KEY, isAuto ? 'true' : 'false');
        } catch (e) {}

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
    // HINT TOAST — bulletproof for iPhone
    // ============================================================
    let hintTimeout = null;
    let hintElement = null;

    function showAutoHint() {
        console.log('💬 Showing auto-switch hint');

        if (hintElement && hintElement.parentNode) {
            hintElement.parentNode.removeChild(hintElement);
        }
        hintElement = null;
        if (hintTimeout) {
            clearTimeout(hintTimeout);
            hintTimeout = null;
        }

        hintElement = document.createElement('div');
        hintElement.className = 'theme-hint-toast';
        hintElement.textContent = '👆👆 Double tap for Auto switch';

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        hintElement.style.cssText = `
            position: fixed !important;
            bottom: 90px !important;
            right: 20px !important;
            left: auto !important;
            top: auto !important;
            z-index: 2147483647 !important;
            background: ${isDark ? '#161b22' : '#ffffff'} !important;
            color: ${isDark ? '#f1f3f5' : '#212529'} !important;
            border: 1px solid ${isDark ? '#30363d' : '#dee2e6'} !important;
            border-radius: 10px !important;
            padding: 12px 18px !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            box-shadow: 0 6px 20px rgba(0,0,0,${isDark ? '0.5' : '0.15'}) !important;
            max-width: 280px !important;
            font-family: system-ui, -apple-system, sans-serif !important;
            opacity: 0;
            transform: translateY(10px);
            transition: opacity 0.3s ease, transform 0.3s ease;
            pointer-events: none !important;
            user-select: none !important;
            -webkit-user-select: none !important;
            display: block !important;
        `;

        document.body.appendChild(hintElement);

        // Force reflow to make sure transition works
        void hintElement.offsetHeight;

        requestAnimationFrame(() => {
            if (hintElement) {
                hintElement.style.opacity = '1';
                hintElement.style.transform = 'translateY(0)';
            }
        });

        hintTimeout = setTimeout(() => {
            if (!hintElement) return;
            hintElement.style.opacity = '0';
            hintElement.style.transform = 'translateY(10px)';
            setTimeout(() => {
                if (hintElement && hintElement.parentNode) {
                    hintElement.parentNode.removeChild(hintElement);
                }
                hintElement = null;
            }, 300);
        }, HINT_DURATION);
    }

    // ============================================================
    // PUBLIC API
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
        console.log('🔄 Auto mode re-enabled');
    };

    window.showThemeAutoHint = showAutoHint;

    // ============================================================
    // AUTO-SWITCH TIMER
    // ============================================================
    function startAutoSwitch() {
        setInterval(() => {
            const current = getCurrentTheme();
            if (current.isAuto) {
                const timeTheme = getTimeBasedTheme();
                if (timeTheme !== html.getAttribute('data-theme')) {
                    applyTheme(timeTheme, true);
                }
            }
        }, 60000);

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
        console.log('✅ Master theme controller initialized. Mode:', isAuto ? 'Auto' : 'Manual');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
