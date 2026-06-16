document.addEventListener("DOMContentLoaded", () => {
  const pages = [
    {
      title: "Consistency Analysis",
      file: "mastery-consistency-analysis.html",
    },
    {
      title: "90 Day Roadmap",
      file: "roadmap.html",
    },
    {
      title: "Dashboard",
      file: "dashboard.html",
    },
    {
      title: "Sample File",
      file: "sample-file.html",
    },
  ];

  const currentPage = window.location.pathname.split("/").pop();

  const sidebar = document.getElementById("sidebar");

  sidebar.innerHTML = `
<div class="logo">
    Mastery System
</div>

<div class="nav-section">
    <div class="nav-title">
        Pages
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
    `;
});
