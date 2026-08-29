// =====================================================
// HKDMservices - Global Day / Night Theme
// =====================================================

(function () {
    "use strict";

    const STORAGE_KEY = "hkdm-theme";

    // ---------------------------------------------
    // Get saved theme
    // ---------------------------------------------

    function getSavedTheme() {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved === "dark" || saved === "light") {
            return saved;
        }

        return "light";
    }


    // ---------------------------------------------
    // Apply theme
    // ---------------------------------------------

    function applyTheme(theme) {

        document.documentElement.setAttribute(
            "data-theme",
            theme
        );

        localStorage.setItem(
            STORAGE_KEY,
            theme
        );

        updateThemeButtons(theme);
    }


    // ---------------------------------------------
    // Update all theme buttons
    // ---------------------------------------------

    function updateThemeButtons(theme) {

        const buttons =
            document.querySelectorAll(
                ".theme-toggle"
            );


        buttons.forEach(button => {

            const icon =
                button.querySelector(
                    ".theme-icon"
                );

            const text =
                button.querySelector(
                    ".theme-text"
                );


            if (theme === "dark") {

                if (icon) {
                    icon.className =
                        "bi bi-sun-fill theme-icon";
                }

                if (text) {
                    text.textContent =
                        "Light Mode";
                }

                button.setAttribute(
                    "aria-label",
                    "Switch to light mode"
                );

                button.setAttribute(
                    "title",
                    "Switch to light mode"
                );

            } else {

                if (icon) {
                    icon.className =
                        "bi bi-moon-stars-fill theme-icon";
                }

                if (text) {
                    text.textContent =
                        "Dark Mode";
                }

                button.setAttribute(
                    "aria-label",
                    "Switch to dark mode"
                );

                button.setAttribute(
                    "title",
                    "Switch to dark mode"
                );
            }

        });
    }


    // ---------------------------------------------
    // Toggle theme
    // ---------------------------------------------

    function toggleTheme() {

        const current =
            document.documentElement.getAttribute(
                "data-theme"
            ) || "light";


        const next =
            current === "dark"
                ? "light"
                : "dark";


        applyTheme(next);
    }


    // ---------------------------------------------
    // Initialize before page is fully loaded
    // ---------------------------------------------

    applyTheme(
        getSavedTheme()
    );


    // ---------------------------------------------
    // Setup buttons
    // ---------------------------------------------

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            updateThemeButtons(
                getSavedTheme()
            );


            document
                .querySelectorAll(
                    ".theme-toggle"
                )
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        toggleTheme
                    );

                });

        }
    );


    // ---------------------------------------------
    // Expose functions if needed
    // ---------------------------------------------

    window.HKDMTheme = {
        applyTheme,
        toggleTheme,
        getSavedTheme
    };

})();
