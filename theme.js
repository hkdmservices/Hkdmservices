// ============================================================
// HKDMSERVICES GLOBAL THEME
// Light / Dark Mode
// ============================================================

(function () {

    const STORAGE_KEY = "hkdm-theme";

    const html = document.documentElement;

    function getSavedTheme() {

        const saved =
            localStorage.getItem(STORAGE_KEY);

        if (saved === "dark" || saved === "light") {
            return saved;
        }

        return "light";
    }


    function applyTheme(theme) {

        html.setAttribute(
            "data-theme",
            theme
        );

        localStorage.setItem(
            STORAGE_KEY,
            theme
        );

        updateThemeButton(theme);
    }


    function updateThemeButton(theme) {

        const button =
            document.getElementById(
                "themeToggle"
            );

        const icon =
            document.getElementById(
                "themeIcon"
            );

        if (!button || !icon) {
            return;
        }


        if (theme === "dark") {

            icon.className =
                "bi bi-sun-fill";

            button.setAttribute(
                "aria-label",
                "Switch to light mode"
            );

            button.setAttribute(
                "title",
                "Switch to light mode"
            );

        } else {

            icon.className =
                "bi bi-moon-stars-fill";

            button.setAttribute(
                "aria-label",
                "Switch to dark mode"
            );

            button.setAttribute(
                "title",
                "Switch to dark mode"
            );

        }

    }


    function initializeTheme() {

        const theme =
            getSavedTheme();

        applyTheme(theme);

        const button =
            document.getElementById(
                "themeToggle"
            );

        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            function () {

                const currentTheme =
                    html.getAttribute(
                        "data-theme"
                    ) || "light";

                const newTheme =
                    currentTheme === "dark"
                        ? "light"
                        : "dark";

                applyTheme(newTheme);

            }
        );

    }


    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeTheme
        );

    } else {

        initializeTheme();

    }

})();
