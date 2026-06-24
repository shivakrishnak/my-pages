/* ==========================================================
   shell.js — shared nav behavior for shivakrishnak/my-pages
   Sidebar toggle · reading progress · scroll spy · search ·
   swipe gestures · dark mode · copy-anchor-links
   ========================================================== */
(function () {
  "use strict";

  var sidebar, overlay, hamburger, closeBtn, searchInput, darkBtn, progressBar;

  /* ── Init on DOM ready ──
     shell.js can be loaded two ways:
     1. A static <script src="shell.js"> in the original HTML — in
        this case DOMContentLoaded hasn't fired yet, so the listener
        below catches it normally.
     2. Dynamically injected by core/init.js AFTER it builds the DOM
        — in this case DOMContentLoaded already fired before this
        script even started downloading, so the listener would never
        run. The readyState check below covers that case by calling
        initAll() immediately instead of waiting for an event that's
        already in the past. */
  function initAll() {
    sidebar = document.getElementById("ms-sidebar");
    overlay = document.getElementById("ms-overlay");
    hamburger = document.getElementById("ms-hamburger");
    closeBtn = document.getElementById("ms-sidebar-close");
    searchInput = document.getElementById("ms-search");
    darkBtn = document.getElementById("ms-dark-btn");
    progressBar = document.querySelector(".ms-progress-bar");

    initDark();
    initSidebar();
    initProgress();
    initScrollSpy();
    initSearch();
    initSwipe();
    initCopyAnchors();
    initReadingTime();
    initSmoothScroll();
    highlightCurrent();
    initBottomNav();
  }

  // If the document is still loading, wait for the normal event.
  // If it's already past that point (dynamic load via init.js, or
  // this script tag simply appears after the body), run right away.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

  /* ──────────── DARK MODE ──────────── */
  function initDark() {
    if (!darkBtn) return;
    var saved = localStorage.getItem("ms-dark");
    if (saved === "1") applyDark(true);

    darkBtn.addEventListener("click", function () {
      var isDark = document.documentElement.classList.toggle("dark");
      localStorage.setItem("ms-dark", isDark ? "1" : "0");
      updateDarkIcon(isDark);
    });
    updateDarkIcon(document.documentElement.classList.contains("dark"));
  }
  function applyDark(on) {
    if (on) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    updateDarkIcon(on);
  }
  function updateDarkIcon(isDark) {
    if (!darkBtn) return;
    darkBtn.innerHTML = isDark
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    darkBtn.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode",
    );
  }

  /* ──────────── SIDEBAR ──────────── */
  function initSidebar() {
    if (!sidebar) return;

    function openSidebar() {
      sidebar.classList.add("open");
      if (overlay) overlay.classList.add("active");
      document.body.style.overflow = "hidden";
      if (hamburger) hamburger.setAttribute("aria-expanded", "true");
    }
    function closeSidebar() {
      sidebar.classList.remove("open");
      if (overlay) overlay.classList.remove("active");
      document.body.style.overflow = "";
      if (hamburger) hamburger.setAttribute("aria-expanded", "false");
    }
    window.openSidebar = openSidebar;
    window.closeSidebar = closeSidebar;

    if (hamburger)
      hamburger.addEventListener("click", function () {
        sidebar.classList.contains("open") ? closeSidebar() : openSidebar();
      });
    if (closeBtn) closeBtn.addEventListener("click", closeSidebar);
    if (overlay) overlay.addEventListener("click", closeSidebar);

    // Escape key
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && sidebar.classList.contains("open"))
        closeSidebar();
    });
  }

  /* ──────────── READING PROGRESS ──────────── */
  function initProgress() {
    if (!progressBar) return;
    function update() {
      var total = document.documentElement.scrollHeight - window.innerHeight;
      var pct = total > 0 ? (window.scrollY / total) * 100 : 0;
      progressBar.style.width = Math.min(100, pct).toFixed(1) + "%";
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ──────────── SCROLL SPY ──────────── */
  function initScrollSpy() {
    var sections = document.querySelectorAll(".ms-section[id]");
    var tocLinks = document.querySelectorAll(
      '.ms-toc a, .ms-nav-item.sub[href*="#"]',
    );
    if (!sections.length || !tocLinks.length) return;

    var current = "";
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            current = entry.target.id;
            tocLinks.forEach(function (link) {
              var href = link.getAttribute("href") || "";
              var active = href.endsWith("#" + current);
              link.classList.toggle("active", active);
            });
          }
        });
      },
      { rootMargin: "-56px 0px -65% 0px", threshold: 0 },
    );

    sections.forEach(function (s) {
      io.observe(s);
    });
  }

  /* ──────────── SEARCH ──────────── */
  function initSearch() {
    if (!searchInput || !sidebar) return;
    var allItems = sidebar.querySelectorAll(".ms-nav-item");
    var labels = sidebar.querySelectorAll(".ms-nav-label");

    searchInput.addEventListener("input", function () {
      var q = searchInput.value.toLowerCase().trim();
      allItems.forEach(function (item) {
        var text = item.textContent.toLowerCase();
        item.style.display = !q || text.includes(q) ? "" : "none";
      });
      // show/hide section labels based on visible items
      labels.forEach(function (label) {
        var next = label.nextElementSibling;
        var hasVisible = false;
        while (next && !next.classList.contains("ms-nav-label")) {
          if (next.style.display !== "none") hasVisible = true;
          next = next.nextElementSibling;
        }
        label.style.display = hasVisible ? "" : "none";
      });
    });
  }

  /* ──────────── SWIPE TO OPEN SIDEBAR ──────────── */
  function initSwipe() {
    if (!sidebar) return;
    var startX = 0,
      startY = 0,
      dragging = false;

    document.addEventListener(
      "touchstart",
      function (e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        dragging = false;
      },
      { passive: true },
    );

    document.addEventListener(
      "touchmove",
      function (e) {
        if (!dragging) {
          var dx = e.touches[0].clientX - startX;
          var dy = Math.abs(e.touches[0].clientY - startY);
          // Only horizontal swipes more than 10px from left edge
          if (Math.abs(dx) > 10 && dy < 50) dragging = true;
        }
      },
      { passive: true },
    );

    document.addEventListener(
      "touchend",
      function (e) {
        if (!dragging) return;
        var dx = e.changedTouches[0].clientX - startX;
        // Swipe right from left edge to open
        if (dx > 60 && startX < 30 && !sidebar.classList.contains("open")) {
          window.openSidebar && window.openSidebar();
        }
        // Swipe left to close
        if (dx < -60 && sidebar.classList.contains("open")) {
          window.closeSidebar && window.closeSidebar();
        }
        dragging = false;
      },
      { passive: true },
    );
  }

  /* ──────────── COPY ANCHOR LINKS ──────────── */
  function initCopyAnchors() {
    var headings = document.querySelectorAll("h2[id], h3[id]");
    headings.forEach(function (h) {
      h.style.cursor = "pointer";
      h.setAttribute("title", "Click to copy link to this section");
      h.addEventListener("click", function () {
        var url = location.origin + location.pathname + "#" + h.id;
        if (navigator.clipboard) {
          navigator.clipboard
            .writeText(url)
            .then(function () {
              showToast("Link copied");
            })
            .catch(function () {});
        }
      });
    });
  }

  /* ──────────── TOAST ──────────── */
  function showToast(msg) {
    var t = document.createElement("div");
    t.textContent = msg;
    Object.assign(t.style, {
      position: "fixed",
      bottom: "80px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "var(--text-1)",
      color: "var(--bg)",
      padding: "8px 16px",
      borderRadius: "6px",
      fontSize: "13px",
      fontWeight: "500",
      zIndex: "9999",
      opacity: "0",
      transition: "opacity 0.2s",
      pointerEvents: "none",
      whiteSpace: "nowrap",
      fontFamily: "var(--font)",
    });
    document.body.appendChild(t);
    requestAnimationFrame(function () {
      t.style.opacity = "1";
    });
    setTimeout(function () {
      t.style.opacity = "0";
      setTimeout(function () {
        t.parentNode && t.parentNode.removeChild(t);
      }, 300);
    }, 1800);
  }

  /* ──────────── READING TIME ──────────── */
  function initReadingTime() {
    var el = document.getElementById("ms-reading-time");
    if (!el) return;
    var content = document.querySelector(".ms-content");
    if (!content) return;
    var words = content.textContent.trim().split(/\s+/).length;
    var mins = Math.ceil(words / 220);
    el.textContent = mins + " min read";
  }

  /* ──────────── SMOOTH SCROLL ──────────── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function (e) {
        var id = link.getAttribute("href").slice(1);
        var target = document.getElementById(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          // close mobile sidebar
          if (sidebar && sidebar.classList.contains("open")) {
            window.closeSidebar && window.closeSidebar();
          }
        }
      });
    });
  }

  /* ──────────── HIGHLIGHT CURRENT PAGE ──────────── */
  function highlightCurrent() {
    var path = location.pathname;
    var file = path.split("/").pop() || "index.html";
    document
      .querySelectorAll(".ms-nav-item:not(.sub)")
      .forEach(function (link) {
        var href = link.getAttribute("href") || "";
        if (href && !href.includes("#") && href.includes(file)) {
          link.classList.add("active");
        }
      });
  }

  /* ──────────── BOTTOM NAV ──────────── */
  function initBottomNav() {
    var btns = document.querySelectorAll(".ms-bottom-nav-item[data-action]");
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-action");
        if (action === "menu") {
          window.openSidebar && window.openSidebar();
        }
        if (action === "top") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        if (action === "dark") {
          var isDark = document.documentElement.classList.toggle("dark");
          localStorage.setItem("ms-dark", isDark ? "1" : "0");
          updateDarkIcon(isDark);
        }
      });
    });
  }
})();
