document.addEventListener("DOMContentLoaded", async () => {
  const sidebar = document.getElementById("sidebar");

  if (!sidebar) return;

  const path = window.location.pathname;

  const currentPage = path.split("/").pop();

  try {
    const response = await fetch("../config/pages.json");

    const pages = await response.json();

    const groups = {};

    pages.forEach((page) => {
      if (!groups[page.group]) {
        groups[page.group] = [];
      }

      groups[page.group].push(page);
    });

    sidebar.innerHTML = `
      <div class="logo">
        Mastery System
      </div>

      ${Object.entries(groups)
        .map(
          ([group, pages]) => `
          <div class="nav-section">

            <div class="nav-title">
              ${group}
            </div>

            ${pages
              .map(
                (page) => `
              <a
                href="./${page.file}"
                class="nav-link ${currentPage === page.file ? "active" : ""}"
              >
                ${page.title}
              </a>
            `,
              )
              .join("")}

          </div>
        `,
        )
        .join("")}
    `;
  } catch (err) {
    console.error("Sidebar load failed", err);
  }
});
