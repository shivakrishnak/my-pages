/* ============================================================
   my-pages — core/init.js
   Unified shell for every page in the repo.

   LAYOUT MODES (set on <body data-layout="...">)
     full     (default — omit the attribute entirely) → full sidebar
               + mobile nav, page content wrapped inside .content
     minimal  → thin top strip only (home link + theme toggle),
               page supplies its own nav/sidebar/structure
     none     → completely hands-off, page renders untouched

   THEME
     Applied to <html data-theme="light|dark"> before paint.
     Default is light. Persisted in localStorage under "mypages-theme".
     Any page can read/set it via window.MyPagesTheme.

   IMPORTANT: this script never reassigns body.innerHTML. Doing so
   would destroy and silently fail to re-run any <script> tags
   already in the page (browsers do not execute scripts inserted via
   innerHTML). Instead it moves real DOM nodes with appendChild, which
   preserves script execution, event listeners, and node identity.
   ============================================================ */

(function () {
  "use strict";

  /* ---------------- theme: applied immediately, before paint ---------------- */
  const THEME_KEY = "mypages-theme";

  function getStoredTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (e) {
      return null;
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  const initialTheme = getStoredTheme() === "dark" ? "dark" : "light";
  applyTheme(initialTheme);

  function setTheme(theme) {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      /* storage unavailable; theme still applies for this session */
    }
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      const knob = btn.querySelector(".theme-toggle-knob");
      if (knob) knob.textContent = theme === "dark" ? "🌙" : "☀️";
    });
  }

  function toggleTheme() {
    setTheme(currentTheme() === "dark" ? "light" : "dark");
  }

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light";
  }

  window.MyPagesTheme = {
    set: setTheme,
    toggle: toggleTheme,
    get: currentTheme,
  };

  function themeToggleMarkup(mini) {
    const icon = initialTheme === "dark" ? "🌙" : "☀️";
    return (
      '<button type="button" class="' +
      (mini ? "theme-toggle-mini" : "theme-toggle") +
      '" data-theme-toggle aria-label="Toggle dark mode" aria-pressed="' +
      (initialTheme === "dark" ? "true" : "false") +
      '">' +
      '<span class="theme-toggle-track"><span class="theme-toggle-knob">' +
      icon +
      "</span></span>" +
      (mini ? "" : '<span class="theme-toggle-label">Dark mode</span>') +
      "</button>"
    );
  }

  function wireThemeToggles(root) {
    root.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      if (btn.dataset.wired) return;
      btn.dataset.wired = "true";
      btn.addEventListener("click", toggleTheme);
    });
  }

  /* ---------------- global stylesheet ---------------- */
  function resolveCorePath(file) {
    // Pages live one level down (/pages/x.html) or at root (/index.html).
    // Resolve core/ relative to depth so this works from either location.
    const depth = location.pathname.replace(/\/+$/, "").split("/").length;
    const atRoot = !location.pathname.includes("/pages/");
    return atRoot ? "core/" + file : "../core/" + file;
  }

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = resolveCorePath("layout.css");
  document.head.appendChild(css);

  /* ---------------- shell injection (non-destructive) ---------------- */
  function buildShell(mode) {
    const shell = document.createElement("div");

    if (mode === "minimal") {
      shell.className = "minimal-shell";
      shell.innerHTML =
        '<div class="topbar topbar-minimal">' +
        '<a href="' +
        (location.pathname.includes("/pages/")
          ? "../index.html"
          : "index.html") +
        '" class="topbar-home">My Pages</a>' +
        "</div>" +
        '<div class="minimal-content"></div>';
      return shell;
    }

    // full
    shell.className = "app";
    shell.innerHTML =
      '<aside class="sidebar" id="sidebar"></aside>' +
      '<main class="main">' +
      '<div class="mobile-nav" id="mobileNav"></div>' +
      '<div class="content" id="pageContent"></div>' +
      "</main>";
    return shell;
  }

  async function populateNav(sidebarEl, mobileNavEl) {
    try {
      const corePath = resolveCorePath("pages.json");
      const res = await fetch(corePath);
      const pages = await res.json();
      const current = location.pathname.split("/").pop();

      sidebarEl.innerHTML =
        '<div class="sidebar-logo"><h1>My Pages</h1><p>Personal knowledge hub</p></div>' +
        themeToggleMarkup(false) +
        '<div class="nav-section-label">Pages</div>' +
        pages
          .map(function (page) {
            return (
              '<a href="' +
              page.file +
              '" class="nav-item' +
              (current === page.file ? " active" : "") +
              '"><span class="nav-dot"></span>' +
              page.title +
              "</a>"
            );
          })
          .join("");

      if (mobileNavEl) {
        mobileNavEl.innerHTML = pages
          .map(function (page) {
            return (
              '<a href="' +
              page.file +
              '" class="mobile-nav-item' +
              (current === page.file ? " active" : "") +
              '">' +
              page.title +
              "</a>"
            );
          })
          .join("");
      }

      wireThemeToggles(sidebarEl);
    } catch (err) {
      console.error("my-pages: could not load pages.json", err);
    }
  }

  function init() {
    const mode = document.body.dataset.layout || "full";

    if (mode === "none") {
      wireThemeToggles(document);
      return;
    }

    const shell = buildShell(mode);
    const target =
      mode === "minimal"
        ? shell.querySelector(".minimal-content")
        : shell.querySelector("#pageContent");

    // Move the page's real, original nodes into the shell's content slot.
    // appendChild() MOVES a node rather than cloning it, so we can safely
    // walk document.body.firstChild in a loop — each move automatically
    // advances firstChild to the next original node. We never touch
    // body.innerHTML, which is what preserves inline <script> execution
    // (browsers do not re-run scripts inserted via innerHTML, but a
    // script tag that is simply relocated via appendChild keeps running
    // fine — and any handlers it already attached stay attached, since
    // the element itself is never destroyed or recreated).
    while (document.body.firstChild) {
      target.appendChild(document.body.firstChild);
    }
    document.body.appendChild(shell);

    if (mode === "minimal") {
      shell
        .querySelector(".topbar-minimal")
        .insertAdjacentHTML("beforeend", themeToggleMarkup(true));
      wireThemeToggles(shell);
      return;
    }

    // full mode
    const sidebarEl = shell.querySelector("#sidebar");
    const mobileNavEl = shell.querySelector("#mobileNav");
    populateNav(sidebarEl, mobileNavEl);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
