# my-pages

Shiva's personal knowledge hub — a growing library of frameworks, systems, trackers, and notes, published via GitHub Pages.

**Live site:** https://shivakrishnak.github.io/my-pages/

**Full how-to guide (read this first):** `pages/guides/how-to-add-a-page.html` — covers everything below in more depth, plus troubleshooting for the most common publishing mistake (a page with no CSS applied).

## How it works

This is a static site with one shared design system and a self-updating homepage:

```
my-pages/
├── index.html                ← homepage, fetches core/registry.json and renders cards
├── core/
│   ├── shell.css              ← shared design system (colors, layout, components, dark mode)
│   ├── shell.js                ← shared nav behavior (sidebar, search, scroll-spy, swipe)
│   ├── generate_registry.py   ← scans pages/ recursively, writes core/registry.json
│   ├── registry.json           ← generated — do not edit by hand
│   └── templates/
│       ├── template-standalone.html    ← copy this for single-screen pages (no sidebar)
│       └── template-with-sidebar.html  ← copy this for long-form reference docs (with TOC)
└── pages/
    ├── guides/
    │   └── how-to-add-a-page.html      ← full instructions, also live on the site itself
    └── mastery/                         ← a project group — every file here is one related set of pages
        ├── part1.html
        ├── ...
        └── 90day-plan.html
```

## Grouping pages into projects

Related pages live together in their own subfolder under `pages/`. The subfolder name becomes the default homepage category automatically — `pages/mastery/*.html` groups under **"Mastery System"** with zero per-file configuration.

```
pages/
├── mastery/           → groups as "Mastery System" (or override with page-category meta)
│   ├── part1.html
│   └── ...
├── finance/            → a future project, groups as "Finance" automatically
│   └── budget.html
└── standalone-page.html → no subfolder, groups under "General"
```

Override the auto-derived label any time with an explicit meta tag (see below) — useful when a page logically belongs with its folder-mates on disk but should appear in a different homepage group, the way `90day-plan.html` sits in `pages/mastery/` but is tagged `Trackers & Tools` since it's a tool, not reference reading.

## Adding a new page — quick version

1. Pick a template from `core/templates/` — `template-standalone.html` for a single-screen page, `template-with-sidebar.html` for a long-form doc with multiple sections.
2. Copy it into the right project folder (or a new one) under `pages/`.
3. Edit every block marked `░░░ EDIT ░░░` — title, description, content, and the asset paths if the folder depth differs from the template's default (`pages/<folder>/file.html`).
4. Add metadata to `<head>` so the homepage can list it well:
   ```html
   <title>Your Page Title</title>
   <meta
     name="description"
     content="One sentence shown on the homepage card."
   />
   <meta name="page-icon" content="🧪" />
   <meta name="page-order" content="1" />
   <!-- optional, sort within category -->
   <meta name="page-category" content="Custom Label" />
   <!-- optional, overrides folder-derived category -->
   ```
   Omit `page-category` to use the folder name automatically. Set `<meta name="page-hidden" content="true">` to keep a page off the homepage without deleting it.
5. Run the registry generator from the repo root:
   ```bash
   python core/generate_registry.py
   ```
6. Commit and push. GitHub Pages serves the updated site automatically.

**For the full step-by-step with troubleshooting**, see `pages/guides/how-to-add-a-page.html` — it covers the same ground in more depth, including the four most common reasons a new page shows up unstyled, and is itself a working example of the sidebar template.

## Design philosophy

Every page shares the same **shell** — sidebar navigation (when used), topbar, mobile bottom-nav, dark mode, typography, and color tokens — so the hub feels like one coherent product rather than a pile of disconnected documents.

Within that shell, each page is free to bring its own layout and components. A multi-section reference document, an interactive day-by-day tracker, and a single-screen tool can all look and behave differently where it matters, while still sharing navigation, accessibility, and visual language. Don't fork `shell.css` per page — extend it with a page-local `<style>` block instead, the way the homepage does for its card grid.

Projects are organized as folders under `pages/`, not by naming convention — this keeps the URL structure, the file tree, and the homepage grouping all telling the same story. A brand new, visually distinct project type takes zero changes to `index.html`, `shell.css`, or the registry script — only files inside that project's own folder.

## Pages

| Page                                  | What it is                                                       |
| ------------------------------------- | ---------------------------------------------------------------- |
| `pages/guides/how-to-add-a-page.html` | How-to guide for adding pages and projects, with troubleshooting |
| `pages/mastery/part1.html`            | Part I — The Science of learning, memory, voice, and fluency     |
| `pages/mastery/part2a.html`           | Part II — Voice, Pronunciation & Structured Speaking (§3–6)      |
| `pages/mastery/part2b.html`           | Part II — Thinking & Communication (§7–16)                       |
| `pages/mastery/part2c.html`           | Part II — Advanced Skills (§17–27)                               |
| `pages/mastery/part3-4.html`          | Part III & IV — Drills, Templates & Execution Plan               |
| `pages/mastery/part5.html`            | Part V — Resources, books, tools, glossary                       |
| `pages/mastery/90day-plan.html`       | Interactive 90-day action plan with streak tracker               |
