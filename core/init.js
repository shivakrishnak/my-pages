(function () {
  /* ------------------
     theme: apply before paint
     ------------------ */
  const THEME_KEY = "mypages-theme";

  function getStoredTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (err) {
      return null;
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  // Default is light. Only switch to dark if explicitly saved.
  const initialTheme = getStoredTheme() === "dark" ? "dark" : "light";
  applyTheme(initialTheme);

  function setTheme(theme) {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (err) {
      /* storage unavailable, theme still applies for this session */
    }
    document.querySelectorAll("[data-theme-toggle]").forEach((el) => {
      el.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    });
  }

  function toggleTheme() {
    const current =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "dark"
        : "light";
    setTheme(current === "dark" ? "light" : "dark");
  }

  // Exposed so any page (including standalone ones) can wire up its own
  // toggle button without re-implementing the storage/apply logic.
  window.MyPagesTheme = {
    set: setTheme,
    toggle: toggleTheme,
    get: () =>
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "dark"
        : "light",
  };

  function themeToggleMarkup(mini) {
    return `
      <button
        type="button"
        class="${mini ? "theme-toggle-mini" : "theme-toggle"}"
        data-theme-toggle
        aria-label="Toggle dark mode"
        aria-pressed="${initialTheme === "dark" ? "true" : "false"}">
        <span class="theme-toggle-track">
          <span class="theme-toggle-knob">${
            initialTheme === "dark" ? "🌙" : "☀️"
          }</span>
        </span>
        ${mini ? "" : '<span class="theme-toggle-label">Dark mode</span>'}
      </button>
    `;
  }

  function wireThemeToggles(root) {
    root.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        toggleTheme();
        const knob = btn.querySelector(".theme-toggle-knob");
        if (knob) {
          knob.textContent = window.MyPagesTheme.get() === "dark" ? "🌙" : "☀️";
        }
      });
    });
  }

  /* ------------------
     global css
     ------------------ */
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "../core/layout.css";
  document.head.appendChild(css);

  window.addEventListener("DOMContentLoaded", async () => {
    const noLayout = document.body.dataset.noLayout === "true";

    /* ------------------
       standalone page
       ------------------ */
    if (noLayout) {
      // Standalone pages still get the toggle wired up if they include
      // an element with [data-theme-toggle] themselves.
      wireThemeToggles(document);
      return;
    }

    const original = document.body.innerHTML;

    /* ------------------
       inject layout
       ------------------ */
    document.body.innerHTML = `
      <div class="app">
        <aside class="sidebar" id="sidebar"></aside>
        <main class="main">
          <div class="mobile-nav" id="mobileNav"></div>
          <div class="content">${original}</div>
        </main>
      </div>
    `;

    /* ------------------
       sidebar
       ------------------ */
    try {
      const res = await fetch("../core/pages.json");
      const pages = await res.json();
      const current = location.pathname.split("/").pop();
      const sidebar = document.getElementById("sidebar");
      const mobileNav = document.getElementById("mobileNav");

      sidebar.innerHTML = `
        <div class="sidebar-logo">
          <h1>My Pages</h1>
          <p>Personal knowledge hub</p>
        </div>
        ${themeToggleMarkup(false)}
        <div class="nav-section-label">Pages</div>
        ${pages
          .map(
            (page) => `
              <a href="${page.file}" class="nav-item ${
                current === page.file ? "active" : ""
              }">
                <span class="nav-dot"></span>
                ${page.title}
              </a>
            `,
          )
          .join("")}
      `;

      mobileNav.innerHTML = pages
        .map(
          (page) => `
            <a href="${page.file}" class="mobile-nav-item ${
              current === page.file ? "active" : ""
            }">${page.title}</a>
          `,
        )
        .join("");

      wireThemeToggles(sidebar);
    } catch (err) {
      console.error(err);
    }
  });
})();
