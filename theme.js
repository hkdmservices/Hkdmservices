/* =====================================================
   THEME MANAGER
===================================================== */

export function initTheme() {
    // Inject theme styles dynamically if missing
    if (!document.getElementById("hkdm-theme-styles")) {
        const styleEl = document.createElement("style");
        styleEl.id = "hkdm-theme-styles";
        styleEl.innerHTML = `
            body {
                transition: background-color 0.3s ease, color 0.3s ease;
            }
            [data-bs-theme="light"] {
                background-color: #f8f9fa;
                color: #212529;
            }
            [data-bs-theme="dark"] {
                background-color: #121212;
                color: #f8f9fa;
            }
            [data-bs-theme="light"] .card {
                background-color: #ffffff;
                color: #212529;
            }
            [data-bs-theme="dark"] .card {
                background-color: #1e1e1e;
                color: #f8f9fa;
            }
        `;
        document.head.appendChild(styleEl);
    }

    const themeToggleBtn = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");

    if (!themeToggleBtn || !themeIcon) return;

    function setTheme(theme) {
        document.documentElement.setAttribute("data-bs-theme", theme);
        localStorage.setItem("hkdm_theme", theme);
        
        if (theme === "dark") {
            themeIcon.className = "bi bi-sun-fill";
        } else {
            themeIcon.className = "bi bi-moon-fill";
        }
    }

    // Initialize theme from localStorage or default to dark
    const savedTheme = localStorage.getItem("hkdm_theme") || "dark";
    setTheme(savedTheme);

    themeToggleBtn.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-bs-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        setTheme(newTheme);
    });
}
