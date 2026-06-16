document.addEventListener("DOMContentLoaded", async () => {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;
  const current = location.pathname.split("/").pop();
  const res = await fetch("../core/pages.json");
  const pages = await res.json();
  sidebar.innerHTML =
    "<h2>Pages</h2>" +
    pages
      .map(
        (p) =>
          `<a class="nav-link ${current === p.file ? "active" : ""}" href="./${p.file}">${p.title}</a>`,
      )
      .join("");
});
