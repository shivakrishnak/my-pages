/* =============================================================
   init.js — single entry point for every page in this hub
   v3 — non-destructive injection, registry.json, 3 layout modes
   =============================================================

   Add ONE line to every page's <head>:
       <script src="../../core/init.js"></script>
   (adjust ../../ depth to match the page's folder depth)

   Then control the shell with <body> attributes:

   data-layout="full"    → sidebar + topbar + mobile bottom-nav (DEFAULT)
   data-layout="minimal" → thin topbar only (home link + theme toggle)
   data-layout="none"    → nothing injected; page is fully self-contained

   Wrap page content in:
       <div id="page-content">…</div>
   Everything inside moves into the layout automatically. Scripts
   outside #page-content are harvested and re-executed after layout
   is built (so inline tab/accordion JS keeps working).

   Optional <body> attributes for richer chrome:
       data-title="Page Title"
       data-badge="Tag"
       data-badge-color="indigo|teal|amber|coral"
       data-brand="Hub Name"
       data-toc="true"          auto-build sidebar TOC from h2/h3[id]
============================================================= */

(function () {
  "use strict";

  /* ── 1. Resolve path back to core/ ── */
  var thisScript =
    document.currentScript ||
    (function () {
      var s = document.getElementsByTagName("script");
      return s[s.length - 1];
    })();
  var scriptSrc =
    (thisScript && thisScript.getAttribute("src")) || "core/init.js";
  var coreBase = scriptSrc.replace(/init\.js(\?.*)?$/, ""); // e.g. "../../core/"
  var rootBase = coreBase.replace(/core\/?$/, ""); // e.g. "../../"

  /* ── 2. Inject shell.css ── */
  if (!document.querySelector('link[href$="shell.css"]')) {
    var lnk = document.createElement("link");
    lnk.rel = "stylesheet";
    lnk.href = coreBase + "shell.css";
    document.head.appendChild(lnk);
  }

  /* ── 3. Theme: apply before paint (no flash) ── */
  var THEME_KEY = "ms-theme";
  (function () {
    try {
      var saved = localStorage.getItem(THEME_KEY);
      if (saved === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.setAttribute("data-theme", "light");
      }
    } catch (e) {
      document.documentElement.setAttribute("data-theme", "light");
    }
  })();

  /* theme-color meta for mobile address bar */
  function ensureThemeColorMeta() {
    if (document.querySelector('meta[name="theme-color"]')) return;
    [
      ["(prefers-color-scheme: light)", "#F8F6F1"],
      ["(prefers-color-scheme: dark)", "#121110"],
    ].forEach(function (pair) {
      var m = document.createElement("meta");
      m.name = "theme-color";
      m.media = pair[0];
      m.content = pair[1];
      document.head.appendChild(m);
    });
  }

  /* public API so pages/shell.js can toggle */
  window.MyPagesTheme = {
    get: function () {
      return document.documentElement.getAttribute("data-theme") === "dark"
        ? "dark"
        : "light";
    },
    set: function (t) {
      document.documentElement.setAttribute("data-theme", t);
      try {
        localStorage.setItem(THEME_KEY, t);
      } catch (e) {}
      document.querySelectorAll("[data-theme-icon]").forEach(function (el) {
        el.textContent = t === "dark" ? "☀️" : "🌙";
      });
    },
    toggle: function () {
      window.MyPagesTheme.set(
        window.MyPagesTheme.get() === "dark" ? "light" : "dark",
      );
    },
  };

  /* ── 4. SVG icon strings ── */
  var ICO = {
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    top: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
  };

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s || "";
    return d.innerHTML;
  }

  function themeIcon() {
    return window.MyPagesTheme.get() === "dark" ? "☀️" : "🌙";
  }

  /* ── 5. Build layout ── */
  function buildLayout() {
    var body = document.body;
    var layout = (body.getAttribute("data-layout") || "full").toLowerCase();
    if (["full", "minimal", "none"].indexOf(layout) === -1) layout = "full";

    ensureThemeColorMeta();

    if (layout === "none") return; /* fully self-contained, nothing to do */

    var title = body.getAttribute("data-title") || document.title || "";
    var badge = body.getAttribute("data-badge") || "";
    var badgeColor = body.getAttribute("data-badge-color") || "indigo";
    var brand = body.getAttribute("data-brand") || "Shiva's Knowledge Hub";
    var buildToc = body.getAttribute("data-toc") === "true";
    var homeHref = rootBase + "index.html";

    /* ── Harvest scripts that live OUTSIDE #page-content ──
       These are page-specific scripts (tab switchers, etc.) that need
       to run after the layout exists. We collect their text/src now,
       before moving nodes, so we can re-execute them afterward.       */
    var contentEl = document.getElementById("page-content");
    var pageScripts = [];
    body.querySelectorAll("script").forEach(function (s) {
      if (contentEl && contentEl.contains(s)) return; /* inside content, safe */
      pageScripts.push({ src: s.src, text: s.textContent });
    });

    /* ── Move content nodes (non-destructive) ── */
    /* Collect either #page-content children or all body children */
    var nodesToMove = [];
    if (contentEl) {
      Array.from(contentEl.childNodes).forEach(function (n) {
        nodesToMove.push(n);
      });
    } else {
      Array.from(body.childNodes).forEach(function (n) {
        nodesToMove.push(n);
      });
    }

    /* ── Build shell HTML ── */
    var badgeHtml = badge
      ? '<span class="ms-badge ' +
        esc(badgeColor) +
        '">' +
        esc(badge) +
        "</span>"
      : "";

    var sidebarHtml = "";
    var overlayHtml = "";

    if (layout === "full") {
      overlayHtml = '<div class="ms-overlay" id="ms-overlay"></div>';
      sidebarHtml =
        '<aside class="ms-sidebar" id="ms-sidebar" aria-label="Site navigation">' +
        '<div class="ms-sidebar-header">' +
        '<a href="' +
        homeHref +
        '" class="ms-brand">' +
        esc(brand) +
        "<span>Knowledge Hub</span>" +
        "</a>" +
        '<button class="ms-sidebar-close" id="ms-sidebar-close" aria-label="Close">✕</button>' +
        "</div>" +
        '<div class="ms-sidebar-search">' +
        '<span class="ms-search-icon">⌕</span>' +
        '<input type="search" id="ms-search" placeholder="Search pages…" aria-label="Search pages">' +
        "</div>" +
        '<nav class="ms-toc" id="ms-toc" aria-label="Pages"></nav>' +
        '<div class="ms-sidebar-footer"><a href="' +
        homeHref +
        '">← All pages</a></div>' +
        "</aside>";
    }

    var topbarLeft =
      layout === "full"
        ? '<button class="ms-hamburger" id="ms-hamburger" aria-label="Open navigation" aria-expanded="false">' +
          ICO.menu +
          "</button>" +
          badgeHtml +
          '<span class="ms-topbar-title">' +
          esc(title) +
          "</span>"
        : '<a href="' +
          homeHref +
          '" class="ms-back-home">' +
          ICO.home +
          "<span>My Pages</span></a>" +
          badgeHtml +
          '<span class="ms-topbar-title">' +
          esc(title) +
          "</span>";

    var topbarHtml =
      '<header class="ms-topbar" id="ms-topbar">' +
      '<div class="ms-topbar-left">' +
      topbarLeft +
      "</div>" +
      '<div class="ms-topbar-right">' +
      '<span class="ms-reading-time" id="ms-reading-time"></span>' +
      '<button class="ms-icon-btn" id="ms-dark-btn" aria-label="Toggle dark mode" data-theme-icon>' +
      themeIcon() +
      "</button>" +
      "</div>" +
      "</header>";

    var bottomNavHtml =
      '<nav class="ms-bottom-nav" aria-label="Mobile navigation">' +
      (layout === "full"
        ? '<button class="ms-bnav-item" data-action="menu" aria-label="Menu">' +
          ICO.menu +
          "<span>Menu</span></button>"
        : "") +
      '<a class="ms-bnav-item" href="' +
      homeHref +
      '" aria-label="Home">' +
      ICO.home +
      "<span>Home</span></a>" +
      '<button class="ms-bnav-item" data-action="top" aria-label="Top">' +
      ICO.top +
      "<span>Top</span></button>" +
      '<button class="ms-bnav-item" data-action="dark" aria-label="Theme">' +
      "<span data-theme-icon>" +
      themeIcon() +
      "</span><span>Theme</span>" +
      "</button>" +
      "</nav>";

    var mainClass = layout === "full" ? "ms-main" : "ms-main ms-standalone";

    /* ── Clear body and rebuild ── */
    body.innerHTML = "";

    /* progress bar */
    var prog = document.createElement("div");
    prog.className = "ms-progress";
    prog.setAttribute("aria-hidden", "true");
    prog.innerHTML = '<div class="ms-progress-bar" id="ms-progress-bar"></div>';
    body.appendChild(prog);

    /* skip link */
    var skip = document.createElement("a");
    skip.href = "#ms-content";
    skip.className = "ms-skip-link";
    skip.textContent = "Skip to content";
    body.appendChild(skip);

    /* overlay */
    if (overlayHtml) {
      var ov = document.createElement("div");
      ov.innerHTML = overlayHtml;
      body.appendChild(ov.firstElementChild);
    }

    /* layout wrapper */
    var wrap = document.createElement("div");
    wrap.className = "ms-layout";
    if (sidebarHtml) {
      var sb = document.createElement("div");
      sb.innerHTML = sidebarHtml;
      wrap.appendChild(sb.firstElementChild);
    }

    /* main */
    var mainEl = document.createElement("main");
    mainEl.className = mainClass;
    mainEl.setAttribute("id", "ms-main");

    mainEl.innerHTML = topbarHtml;

    var contentDiv = document.createElement("div");
    contentDiv.className = "ms-content";
    contentDiv.id = "ms-content";

    /* Move original nodes in */
    nodesToMove.forEach(function (n) {
      contentDiv.appendChild(n);
    });

    mainEl.appendChild(contentDiv);
    mainEl.innerHTML += bottomNavHtml; /* append bottom-nav after content */

    wrap.appendChild(mainEl);
    body.appendChild(wrap);

    /* ── Load registry and populate sidebar nav ── */
    if (layout === "full") {
      var tocEl = document.getElementById("ms-toc");
      var currentFile = location.pathname.split("/").pop() || "index.html";

      fetch(coreBase + "registry.json")
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          var pages = data.pages || [];
          var categories = {};
          pages.forEach(function (p) {
            var cat = p.category || "General";
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(p);
          });

          var html = "";
          Object.keys(categories)
            .sort()
            .forEach(function (cat) {
              html += '<div class="ms-nav-label">' + esc(cat) + "</div>";
              categories[cat].forEach(function (p) {
                var file = p.path.split("/").pop();
                var href = rootBase + p.path;
                var active =
                  currentFile === file || location.pathname.endsWith(p.path)
                    ? " active"
                    : "";
                html +=
                  '<a href="' +
                  href +
                  '" class="ms-nav-item' +
                  active +
                  '">' +
                  '<span class="ms-nav-icon">' +
                  (p.icon || "📄") +
                  "</span>" +
                  '<span class="ms-nav-text">' +
                  esc(p.title) +
                  "</span>" +
                  "</a>";
              });
            });
          if (tocEl)
            tocEl.innerHTML =
              html || '<span class="ms-nav-empty">No pages yet</span>';

          /* auto-TOC from headings */
          if (buildToc) {
            var headingToc = "";
            document
              .querySelectorAll(".ms-content h2[id], .ms-content h3[id]")
              .forEach(function (h) {
                var sub = h.tagName === "H3" ? " sub" : "";
                headingToc +=
                  '<a href="#' +
                  h.id +
                  '" class="ms-nav-item' +
                  sub +
                  '">' +
                  esc(h.textContent) +
                  "</a>";
              });
            if (headingToc && tocEl) {
              tocEl.innerHTML +=
                '<div class="ms-nav-label">This page</div>' + headingToc;
            }
          }
        })
        .catch(function () {
          if (tocEl)
            tocEl.innerHTML =
              '<span class="ms-nav-empty">Could not load pages</span>';
        });
    }

    /* ── Re-execute harvested page scripts ── */
    function runScripts(scripts, i) {
      if (i >= scripts.length) return;
      var info = scripts[i];
      var s = document.createElement("script");
      if (info.src) {
        s.src = info.src;
        s.onload = function () {
          runScripts(scripts, i + 1);
        };
        s.onerror = function () {
          runScripts(scripts, i + 1);
        };
      } else {
        try {
          s.textContent = info.text;
        } catch (e) {
          s.text = info.text;
        }
      }
      document.body.appendChild(s);
      if (!info.src) runScripts(scripts, i + 1);
    }

    /* ── Load shell.js (wires all interactivity) ── */
    var shellJs = document.createElement("script");
    shellJs.src = coreBase + "shell.js";
    shellJs.onload = function () {
      runScripts(pageScripts, 0);
    };
    shellJs.onerror = function () {
      runScripts(pageScripts, 0);
    };
    document.body.appendChild(shellJs);
  }

  /* ── Run after DOM is parsed ── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildLayout);
  } else {
    buildLayout();
  }
})();
