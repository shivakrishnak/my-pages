(function () {
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
      return;
    }

    const original = document.body.innerHTML;

    /* ------------------
         inject layout
      ------------------ */

    document.body.innerHTML = `

        <div class="app">

          <aside
            class="sidebar"
            id="sidebar">
          </aside>

          <main class="main">

            <div class="content">

              ${original}

            </div>

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

      sidebar.innerHTML = `

          <div class="sidebar-logo">
            <h1>
              My Pages
            </h1>

            <p>
              Personal knowledge hub
            </p>
          </div>

          <div
            class="nav-section-label">

            Pages

          </div>

          ${pages
            .map(
              (page) => `

            <a
              href="${page.file}"
              class="nav-item
              ${current === page.file ? "active" : ""}">

              <span
                class="nav-dot">
              </span>

              ${page.title}

            </a>

          `,
            )
            .join("")}

        `;
    } catch (err) {
      console.error(err);
    }
  });
})();
