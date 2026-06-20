# my-pages

Shiva's personal knowledge hub — a growing library of frameworks, systems, trackers, and notes, published via GitHub Pages.

**Live site:** https://shivakrishnak.github.io/my-pages/

## How it works

This is a static site with one shared design system and a self-updating homepage:

```
my-pages/
├── index.html              ← homepage, fetches core/registry.json and renders cards
├── core/
│   ├── shell.css            ← shared design system (colors, layout, components, dark mode)
│   ├── shell.js              ← shared nav behavior (sidebar, search, scroll-spy, swipe)
│   ├── generate_registry.py ← scans pages/ recursively, writes core/registry.json
│   └── registry.json         ← generated — do not edit by hand
└── pages/
    └── mastery/               ← a project group — every file here is one related set of pages
        ├── part1.html
        ├── part2a.html
        ├── ...
        └── 90day-plan.html
```

## Grouping pages into projects

Related pages live together in their own subfolder under `pages/`. The subfolder name becomes the default homepage category automatically — `pages/mastery/*.html` groups under **"Mastery"** with zero per-file configuration.

```
pages/
├── mastery/           → groups as "Mastery" (or override with page-category meta)
│   ├── part1.html
│   └── ...
├── finance/            → a future project, groups as "Finance" automatically
│   └── budget.html
└── standalone-page.html → no subfolder, groups under "General"
```

Override the auto-derived label any time with an explicit meta tag (see below) — useful when a page logically belongs with its folder-mates on disk but should appear in a different homepage group, the way `90day-plan.html` sits in `pages/mastery/` but is tagged `Trackers & Tools` since it's a tool, not reference reading.

## Adding a new page

1. Decide if it belongs to an existing project folder (`pages/mastery/`) or needs a new one (`pages/your-project/`). Create the folder if needed.
2. Create the HTML file inside it.
3. Link the shared stylesheet and script — path depends on folder depth:
   ```html
   <!-- file at pages/your-project/page.html -->
   <link rel="stylesheet" href="../../core/shell.css">
   <script src="../../core/shell.js"></script>
   ```
4. Add metadata to `<head>` so the homepage can list it well:
   ```html
   <title>Your Page Title</title>
   <meta name="description" content="One sentence shown on the homepage card.">
   <meta name="page-icon" content="🧪">
   <meta name="page-order" content="1">                  <!-- optional, sort within category -->
   <meta name="page-category" content="Custom Label">    <!-- optional, overrides folder-derived category -->
   ```
   Omit `page-category` to use the folder name automatically. Set `<meta name="page-hidden" content="true">` to keep a page off the homepage without deleting it.
5. Run the registry generator from the repo root:
   ```bash
   python core/generate_registry.py
   ```
6. Commit and push. GitHub Pages serves the updated site automatically.

## Design philosophy

Every page shares the same **shell** — sidebar navigation, topbar, mobile bottom-nav, dark mode, typography, and color tokens — so the hub feels like one coherent product rather than a pile of disconnected documents.

Within that shell, each page is free to bring its own layout and components. A multi-section reference document, an interactive day-by-day tracker, and a future single-screen tool can all look and behave differently where it matters, while still sharing navigation, accessibility, and visual language. Don't fork `shell.css` per page — extend it with a page-local `<style>` block instead.

Projects are organized as folders under `pages/`, not by naming convention — this keeps the URL structure, the file tree, and the homepage grouping all telling the same story.

## Pages

| Page | What it is |
|---|---|
| `pages/mastery/part1.html` | Part I — The Science of learning, memory, voice, and fluency |
| `pages/mastery/part2a.html` | Part II — Voice, Pronunciation & Structured Speaking (§3–6) |
| `pages/mastery/part2b.html` | Part II — Thinking & Communication (§7–16) |
| `pages/mastery/part2c.html` | Part II — Advanced Skills (§17–27) |
| `pages/mastery/part3-4.html` | Part III & IV — Drills, Templates & Execution Plan |
| `pages/mastery/part5.html` | Part V — Resources, books, tools, glossary |
| `pages/mastery/90day-plan.html` | Interactive 90-day action plan with streak tracker |
