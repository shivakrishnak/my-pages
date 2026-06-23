/* =============================================================
   shell.js — nav behavior for shivakrishnak/my-pages
   Loaded by init.js after layout is built.
   ============================================================= */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    initSidebar();
    initDarkBtn();
    initProgress();
    initScrollSpy();
    initSearch();
    initSwipe();
    initBottomNav();
    initReadingTime();
    initSmoothScroll();
    initCopyAnchors();
  });

  /* ── Sidebar ── */
  function initSidebar() {
    var sidebar = document.getElementById("ms-sidebar");
    var overlay = document.getElementById("ms-overlay");
    var hamburger = document.getElementById("ms-hamburger");
    var closeBtn = document.getElementById("ms-sidebar-close");
    if (!sidebar) return;

    function open() {
      sidebar.classList.add("open");
      if (overlay) overlay.classList.add("open");
      document.body.style.overflow = "hidden";
      if (hamburger) hamburger.setAttribute("aria-expanded", "true");
    }
    function close() {
      sidebar.classList.remove("open");
      if (overlay) overlay.classList.remove("open");
      document.body.style.overflow = "";
      if (hamburger) hamburger.setAttribute("aria-expanded", "false");
    }
    window._msSidebarOpen = open;
    window._msSidebarClose = close;

    if (hamburger)
      hamburger.addEventListener("click", function () {
        sidebar.classList.contains("open") ? close() : open();
      });
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (overlay) overlay.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && sidebar.classList.contains("open")) close();
    });
  }

  /* ── Dark mode button in topbar ── */
  function initDarkBtn() {
    var btn = document.getElementById("ms-dark-btn");
    if (!btn || !window.MyPagesTheme) return;
    btn.addEventListener("click", function () {
      window.MyPagesTheme.toggle();
    });
  }

  /* ── Reading progress bar ── */
  function initProgress() {
    var bar = document.getElementById("ms-progress-bar");
    if (!bar) return;
    var main = document.getElementById("ms-main") || window;
    var scrollTarget =
      document.getElementById("ms-main") &&
      document.getElementById("ms-main").style.overflow === "auto"
        ? document.getElementById("ms-main")
        : window;

    function update() {
      var scrollTop, scrollHeight, clientHeight;
      if (scrollTarget === window) {
        scrollTop = window.scrollY;
        scrollHeight = document.documentElement.scrollHeight;
        clientHeight = window.innerHeight;
      } else {
        scrollTop = scrollTarget.scrollTop;
        scrollHeight = scrollTarget.scrollHeight;
        clientHeight = scrollTarget.clientHeight;
      }
      var total = scrollHeight - clientHeight;
      bar.style.width =
        (total > 0 ? Math.min(100, (scrollTop / total) * 100) : 0).toFixed(1) +
        "%";
    }
    scrollTarget.addEventListener("scroll", update, { passive: true });
    window.addEventListener("scroll", update, { passive: true }); /* fallback */
    update();
  }

  /* ── Scroll spy ── */
  function initScrollSpy() {
    var sections = document.querySelectorAll(".ms-section[id]");
    var links = document.querySelectorAll(
      '.ms-nav-item.sub[href*="#"], .ms-toc a[href*="#"]',
    );
    if (!sections.length || !links.length) return;

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            var id = e.target.id;
            links.forEach(function (l) {
              l.classList.toggle(
                "active",
                (l.getAttribute("href") || "").endsWith("#" + id),
              );
            });
          }
        });
      },
      {
        rootMargin:
          "-" +
          (parseInt(
            getComputedStyle(document.documentElement).getPropertyValue(
              "--topbar-h",
            ),
          ) || 52) +
          "px 0px -60% 0px",
        threshold: 0,
      },
    );

    sections.forEach(function (s) {
      io.observe(s);
    });
  }

  /* ── Sidebar search ── */
  function initSearch() {
    var input = document.getElementById("ms-search");
    var toc = document.getElementById("ms-toc");
    if (!input || !toc) return;

    input.addEventListener("input", function () {
      var q = input.value.toLowerCase().trim();
      toc.querySelectorAll(".ms-nav-item").forEach(function (item) {
        if (!item.classList.contains("sub")) {
          item.style.display =
            !q || item.textContent.toLowerCase().includes(q) ? "" : "none";
        }
      });
      toc.querySelectorAll(".ms-nav-label").forEach(function (label) {
        var sib = label.nextElementSibling;
        var visible = false;
        while (sib && !sib.classList.contains("ms-nav-label")) {
          if (sib.style.display !== "none") visible = true;
          sib = sib.nextElementSibling;
        }
        label.style.display = visible ? "" : "none";
      });
    });
  }

  /* ── Swipe to open sidebar ── */
  function initSwipe() {
    var startX = 0,
      startY = 0,
      moved = false;
    document.addEventListener(
      "touchstart",
      function (e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        moved = false;
      },
      { passive: true },
    );
    document.addEventListener(
      "touchmove",
      function (e) {
        if (
          !moved &&
          Math.abs(e.touches[0].clientX - startX) > 10 &&
          Math.abs(e.touches[0].clientY - startY) < 50
        )
          moved = true;
      },
      { passive: true },
    );
    document.addEventListener(
      "touchend",
      function (e) {
        if (!moved) return;
        var dx = e.changedTouches[0].clientX - startX;
        var sidebar = document.getElementById("ms-sidebar");
        if (!sidebar) return;
        if (dx > 60 && startX < 30 && !sidebar.classList.contains("open")) {
          window._msSidebarOpen && window._msSidebarOpen();
        }
        if (dx < -60 && sidebar.classList.contains("open")) {
          window._msSidebarClose && window._msSidebarClose();
        }
        moved = false;
      },
      { passive: true },
    );
  }

  /* ── Bottom nav ── */
  function initBottomNav() {
    document
      .querySelectorAll(".ms-bnav-item[data-action]")
      .forEach(function (btn) {
        btn.addEventListener("click", function () {
          var a = btn.getAttribute("data-action");
          if (a === "menu") window._msSidebarOpen && window._msSidebarOpen();
          if (a === "top") window.scrollTo({ top: 0, behavior: "smooth" });
          if (a === "dark") window.MyPagesTheme && window.MyPagesTheme.toggle();
        });
      });
  }

  /* ── Reading time ── */
  function initReadingTime() {
    var el = document.getElementById("ms-reading-time");
    var content = document.getElementById("ms-content");
    if (!el || !content) return;
    var words = content.textContent.trim().split(/\s+/).length;
    var mins = Math.max(1, Math.ceil(words / 220));
    el.textContent = mins + " min read";
  }

  /* ── Smooth scroll for anchor links ── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function (e) {
        var id = link.getAttribute("href").slice(1);
        var target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        var sidebar = document.getElementById("ms-sidebar");
        if (sidebar && sidebar.classList.contains("open")) {
          window._msSidebarClose && window._msSidebarClose();
        }
      });
    });
  }

  /* ── Copy anchor links on heading click ── */
  function initCopyAnchors() {
    document
      .querySelectorAll(".ms-content h2[id], .ms-content h3[id]")
      .forEach(function (h) {
        h.style.cursor = "pointer";
        h.setAttribute("title", "Click to copy link");
        h.addEventListener("click", function () {
          var url = location.origin + location.pathname + "#" + h.id;
          if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(function () {
              showToast("Link copied");
            });
          }
        });
      });
  }

  /* ── Toast ── */
  function showToast(msg) {
    var t = document.createElement("div");
    t.className = "ms-toast";
    t.textContent = msg;
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
})();
