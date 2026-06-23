/* ============================================================
   init.js — single entry point for every page in this hub

   Usage: one line in <head>, nothing else required.
       <script src="../../core/init.js"></script>

   Controlled by an attribute on <body>:
       <body data-layout="full">     ← sidebar + topbar + bottom-nav (DEFAULT)
       <body data-layout="mixed">    ← topbar + bottom-nav, no sidebar
       <body data-layout="none">     ← nothing injected, fully self-contained page

   If <body> has no data-layout attribute at all, "full" is used —
   so existing pages and quick new pages get the complete shell
   without having to opt in.

   What this script does, in order:
     1. Figures out how many "../" are needed to reach core/ from
        the current page, by inspecting its own <script src>.
     2. Injects <link rel="stylesheet" href=".../core/shell.css">
        into <head> if it isn't already there.
     3. Applies the saved dark-mode preference before paint (this
        script must stay a plain blocking <script> in <head> — no
        defer/async — for that guarantee to hold).
     4. Based on data-layout, injects the sidebar/topbar/bottom-nav
        DOM scaffold around whatever's already in <body>.
     5. Loads core/shell.js, which wires up all interactive
        behavior (dark toggle, search, scroll-spy, swipe, etc.)
        against the DOM this script just created.

   PAGE AUTHOR RESPONSIBILITIES (full / mixed layouts):
     - Wrap your actual content in:
         <div id="page-content">...your html...</div>
       This gets moved into the right place in the injected layout
       automatically. If you don't include this wrapper, init.js
       falls back to using everything already in <body> at call
       time.
     - Optionally provide page metadata as data-attributes on
       <body> for nicer chrome:
         data-title="Page Title"           (topbar + tab title)
         data-badge="Section Tag"          (small colored pill in topbar)
         data-badge-color="indigo"         (indigo|teal|amber|coral|sage)
         data-brand="Project Name"         (sidebar header, full layout only)
         data-toc="true"                   (full layout: auto-build a
                                             sidebar TOC from h2/h3 with
                                             ids found in the content —
                                             skip this if you'd rather
                                             hand-write the sidebar nav,
                                             see core/templates/)
   ============================================================ */

(function () {
  "use strict";

  // ---------- 1. Work out the path back to core/ ----------
  var thisScript =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();
  var scriptSrc = thisScript.getAttribute("src") || "core/init.js";
  // scriptSrc looks like "../../core/init.js" — strip the filename to get the core/ base
  var coreBase = scriptSrc.replace(/init\.js(\?.*)?$/, "");
  var rootBase = coreBase.replace(/core\/$/, ""); // path back to repo root, e.g. "../../"

  // ---------- 2. Inject shell.css if not already present ----------
  if (!document.querySelector('link[href$="shell.css"]')) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = coreBase + "shell.css";
    document.head.appendChild(link);
  }

  // ---------- 3. Apply saved theme immediately ----------
  try {
    if (localStorage.getItem("ms-dark") === "1") {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {
    /* localStorage unavailable — ignore, default light */
  }

  // ---------- Theme-color meta (address-bar tint) ----------
  function ensureThemeColorMeta() {
    if (!document.querySelector('meta[name="theme-color"]')) {
      var light = document.createElement("meta");
      light.name = "theme-color";
      light.content = "#F8F6F1";
      light.media = "(prefers-color-scheme: light)";
      document.head.appendChild(light);
      var dark = document.createElement("meta");
      dark.name = "theme-color";
      dark.content = "#121110";
      dark.media = "(prefers-color-scheme: dark)";
      document.head.appendChild(dark);
    }
  }
  ensureThemeColorMeta();

  // ---------- SVG icon strings (reused across injected nav) ----------
  var ICON_MENU =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
  var ICON_HOME =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
  var ICON_TOP =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>';
  var ICON_DARK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  // ---------- 4. Build the layout once DOM is parseable ----------
  function buildLayout() {
    var body = document.body;
    var layout = (body.getAttribute("data-layout") || "full").toLowerCase();
    if (["full", "mixed", "none"].indexOf(layout) === -1) layout = "full";

    if (layout === "none") {
      // Fully self-contained page — init.js only did steps 1–3 (CSS + dark mode).
      // No DOM injection, no shell.js. The page is on its own from here.
      return;
    }

    var title =
      body.getAttribute("data-title") || document.title || "Untitled Page";
    var badge = body.getAttribute("data-badge") || "";
    var badgeColor = body.getAttribute("data-badge-color") || "indigo";
    var brand = body.getAttribute("data-brand") || "Shiva's Knowledge Hub";
    var buildToc = body.getAttribute("data-toc") === "true";

    // Grab existing content: prefer #page-content wrapper, else take everything in body.
    // Also collect any <script> tags that are direct children of <body> but OUTSIDE
    // #page-content — these are page-specific scripts that need to run after the layout
    // is built (since body.innerHTML = '' would otherwise destroy them without executing).
    var contentWrapper = document.getElementById("page-content");
    var contentHtml;
    var pageScripts = [];

    // Harvest scripts from body that are outside #page-content
    Array.from(
      document.body.querySelectorAll("body > script, body > * > script"),
    ).forEach(function (s) {
      // Only collect scripts that are NOT inside #page-content
      if (!contentWrapper || !contentWrapper.contains(s)) {
        pageScripts.push({ src: s.src, text: s.textContent });
      }
    });

    if (contentWrapper) {
      contentHtml = contentWrapper.innerHTML;
    } else {
      contentHtml = body.innerHTML;
    }

    // Clear body, we rebuild it fully
    body.innerHTML = "";

    // Progress bar + skip link (both layouts)
    var progress = document.createElement("div");
    progress.className = "ms-progress";
    progress.setAttribute("aria-hidden", "true");
    progress.innerHTML =
      '<div class="ms-progress-bar" id="ms-progress-bar"></div>';
    body.appendChild(progress);

    var skip = document.createElement("a");
    skip.href = "#main-content";
    skip.className = "ms-skip-link";
    skip.textContent = "Skip to content";
    body.appendChild(skip);

    var layoutDiv = document.createElement("div");
    layoutDiv.className = "ms-layout";

    var sidebarHtml = "";
    var overlayHtml = "";
    var hamburgerHtml = "";
    var mainClass = "ms-main";

    if (layout === "full") {
      overlayHtml = '<div class="ms-overlay" id="ms-overlay"></div>';
      hamburgerHtml =
        '<button class="ms-hamburger" id="ms-hamburger" aria-label="Open navigation" aria-expanded="false" aria-controls="ms-sidebar">' +
        ICON_MENU +
        "</button>";

      var tocHtml = '<span class="ms-nav-label">This Page</span>';
      if (buildToc) {
        tocHtml += '<div id="ms-auto-toc"></div>';
      } else {
        tocHtml +=
          '<span style="display:block;padding:6px 1.1rem;font-size:11.5px;color:var(--text4);line-height:1.5">No table of contents configured. Add data-toc="true" to &lt;body&gt; for an automatic one, or hand-write sidebar links — see core/templates/template-with-sidebar.html.</span>';
      }

      sidebarHtml =
        '<aside class="ms-sidebar" id="ms-sidebar" aria-label="Site navigation">' +
        '<div class="ms-sidebar-header">' +
        '<a href="' +
        rootBase +
        'index.html" class="ms-brand">' +
        escapeHtml(brand) +
        "<span>Knowledge Hub</span></a>" +
        '<button class="ms-sidebar-close" id="ms-sidebar-close" aria-label="Close navigation">✕</button>' +
        "</div>" +
        '<div class="ms-sidebar-search">' +
        '<span class="ms-search-icon">⌕</span>' +
        '<input type="search" id="ms-search" placeholder="Search sections…" aria-label="Search sections">' +
        "</div>" +
        '<nav class="ms-toc" aria-label="Page sections">' +
        tocHtml +
        "</nav>" +
        '<div class="ms-sidebar-footer"><a href="' +
        rootBase +
        'index.html">← All pages</a></div>' +
        "</aside>";
    }

    var badgeHtml = badge
      ? '<span class="ms-badge ' +
        escapeHtml(badgeColor) +
        '">' +
        escapeHtml(badge) +
        "</span>"
      : "";

    var topbarHtml =
      '<header class="ms-topbar">' +
      '<div class="ms-topbar-left">' +
      hamburgerHtml +
      (layout === "mixed"
        ? '<a href="' +
          rootBase +
          'index.html" style="font-size:13px;font-weight:700;color:var(--text1);text-decoration:none;flex-shrink:0">← ' +
          escapeHtml(brand) +
          "</a>"
        : "") +
      badgeHtml +
      '<span class="ms-topbar-title">' +
      escapeHtml(title) +
      "</span>" +
      "</div>" +
      '<div class="ms-topbar-right">' +
      '<span id="ms-reading-time" style="font-size:11px;color:var(--text3)"></span>' +
      '<button class="ms-icon-btn" id="ms-dark-btn" aria-label="Toggle dark mode"></button>' +
      "</div>" +
      "</header>";

    var bottomNavHtml =
      '<nav class="ms-bottom-nav" aria-label="Mobile navigation">' +
      (layout === "full"
        ? '<button class="ms-bottom-nav-item" data-action="menu" aria-label="Open menu">' +
          ICON_MENU +
          "<span>Menu</span></button>" +
          '<a class="ms-bottom-nav-item" href="' +
          rootBase +
          'index.html" aria-label="Home">' +
          ICON_HOME +
          "<span>Home</span></a>"
        : '<a class="ms-bottom-nav-item" href="' +
          rootBase +
          'index.html" aria-label="Home">' +
          ICON_HOME +
          "<span>Home</span></a>") +
      '<button class="ms-bottom-nav-item" data-action="top" aria-label="Back to top">' +
      ICON_TOP +
      "<span>Top</span></button>" +
      '<button class="ms-bottom-nav-item" data-action="dark" aria-label="Toggle dark mode">' +
      ICON_DARK +
      "<span>Dark</span></button>" +
      "</nav>";

    mainClass = layout === "full" ? "ms-main" : "ms-main ms-standalone";

    layoutDiv.innerHTML =
      sidebarHtml +
      '<main class="' +
      mainClass +
      '" id="main-content">' +
      topbarHtml +
      '<div class="ms-content">' +
      contentHtml +
      "</div>" +
      bottomNavHtml +
      "</main>";

    if (overlayHtml) {
      var overlayEl = document.createElement("div");
      overlayEl.innerHTML = overlayHtml;
      body.appendChild(overlayEl.firstChild);
    }
    body.appendChild(layoutDiv);

    // Auto-build sidebar TOC from h2/h3, if requested. Supports two id
    // patterns: id directly on the heading (<h2 id="s1">), or id on the
    // wrapping .ms-section div (<div class="ms-section" id="s1"><h2>...)
    // — the latter is the pattern used throughout this hub's existing
    // content, so it's checked first.
    if (layout === "full" && buildToc) {
      var tocTarget = document.getElementById("ms-auto-toc");
      if (tocTarget) {
        var headings = document.querySelectorAll(
          ".ms-content h2, .ms-content h3",
        );
        var html = "";
        var found = 0;
        headings.forEach(function (h) {
          var targetId = h.id;
          if (!targetId) {
            var sectionParent = h.closest("[id]");
            if (sectionParent) targetId = sectionParent.id;
          }
          if (!targetId) return; // nothing to link to — skip silently
          found++;
          var prefix = h.tagName === "H3" ? "↳ " : "";
          html +=
            '<a href="#' +
            targetId +
            '" class="ms-nav-item sub">' +
            prefix +
            escapeHtml(h.textContent) +
            "</a>";
        });
        tocTarget.outerHTML = found
          ? html
          : '<span style="display:block;padding:6px 1.1rem;font-size:11.5px;color:var(--text4)">No headings with ids found yet.</span>';
      }
    }

    // Re-execute any page-specific scripts that were outside #page-content.
    // Scripts inside innerHTML don't execute when moved via innerHTML assignment,
    // so we re-create them as real script elements after the layout exists.
    // This runs AFTER shell.js to ensure both are available to page scripts.
    if (pageScripts.length) {
      function runNextScript(index) {
        if (index >= pageScripts.length) return;
        var info = pageScripts[index];
        var s = document.createElement("script");
        if (info.src) {
          s.src = info.src;
          s.onload = function () {
            runNextScript(index + 1);
          };
        } else {
          s.textContent = info.text;
        }
        document.body.appendChild(s);
        if (!info.src) runNextScript(index + 1); // inline scripts execute synchronously
      }
      runNextScript(0);
    }
  }

  // ---------- 5. Load shell.js after layout exists ----------
  function loadShellJs() {
    if (document.querySelector('script[src$="shell.js"]')) return;
    var s = document.createElement("script");
    s.src = coreBase + "shell.js";
    document.body.appendChild(s);
  }

  function run() {
    buildLayout();
    var layout = (
      document.body.getAttribute("data-layout") || "full"
    ).toLowerCase();
    if (layout !== "none") {
      loadShellJs();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
