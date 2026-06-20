#!/usr/bin/env python3
"""
generate_registry.py — Knowledge Hub page registry builder

Scans pages/**/*.html (recursively, so subfolders are supported),
extracts metadata from each file's <head>, and writes
core/registry.json. The homepage (index.html) fetches this JSON at
runtime and renders the page list — so adding a new HTML file under
pages/ and re-running this script is the entire workflow for
publishing a new page.

USAGE
    python core/generate_registry.py

FOLDER STRUCTURE
    pages/some-page.html         -> category defaults to "General"
    pages/mastery/part1.html     -> category defaults to "Mastery"
    pages/finance/budget.html    -> category defaults to "Finance"

    Group related pages by putting them in a subfolder under pages/.
    The subfolder name becomes the default category (title-cased),
    so pages/mastery/ pages are grouped together automatically with
    no per-file metadata required. Override with an explicit
    <meta name="page-category"> tag if you want a different label.

WHAT EACH PAGE NEEDS (all optional except <title>)
    <title>Page Title | Site Name</title>
    <meta name="description" content="One-line summary shown on the homepage card.">
    <meta name="page-category" content="Mastery System">   <!-- overrides folder-derived category -->
    <meta name="page-icon" content="🧠">                    <!-- emoji shown on the card -->
    <meta name="page-order" content="10">                   <!-- optional explicit sort order -->
    <meta name="page-hidden" content="true">                <!-- optional: exclude from homepage -->

If page-category is omitted, the page is grouped by its immediate
parent folder name under pages/ (or "General" if it sits directly
in pages/ with no subfolder).
If page-order is omitted, pages are sorted alphabetically by title
within their category.

This script has no external dependencies — stdlib only — so it
runs anywhere Python 3.7+ is available, including GitHub Actions.
"""

import json
import os
import re
import sys
from datetime import datetime, timezone

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES_DIR = os.path.join(REPO_ROOT, "pages")
OUTPUT_PATH = os.path.join(REPO_ROOT, "core", "registry.json")

TITLE_RE       = re.compile(r"<title>(.*?)</title>", re.IGNORECASE | re.DOTALL)
DESC_RE        = re.compile(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', re.IGNORECASE)
CATEGORY_RE    = re.compile(r'<meta\s+name=["\']page-category["\']\s+content=["\'](.*?)["\']', re.IGNORECASE)
ICON_RE        = re.compile(r'<meta\s+name=["\']page-icon["\']\s+content=["\'](.*?)["\']', re.IGNORECASE)
ORDER_RE       = re.compile(r'<meta\s+name=["\']page-order["\']\s+content=["\'](.*?)["\']', re.IGNORECASE)
HIDDEN_RE      = re.compile(r'<meta\s+name=["\']page-hidden["\']\s+content=["\'](.*?)["\']', re.IGNORECASE)

DEFAULT_CATEGORY = "General"
DEFAULT_ICON     = "📄"


def clean_text(raw):
    """Collapse whitespace, decode common HTML entities, and strip a
    trailing ' | Site Name' suffix from titles."""
    text = re.sub(r"\s+", " ", raw or "").strip()
    text = (text
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&quot;", '"')
            .replace("&#39;", "'"))
    return text


def extract_title(html, fallback):
    m = TITLE_RE.search(html)
    if not m:
        return fallback
    title = clean_text(m.group(1))
    # Strip a " | Something" suffix if present — keep just the page-specific part
    if " | " in title:
        title = title.split(" | ", 1)[0].strip()
    return title or fallback


def extract_meta(pattern, html, default=""):
    m = pattern.search(html)
    return clean_text(m.group(1)) if m else default


def humanize(text):
    """'mastery' -> 'Mastery', 'mastery-system' -> 'Mastery System'."""
    text = text.replace("-", " ").replace("_", " ")
    return text.title()


def folder_category(filepath):
    """
    Derive a default category from the file's immediate parent folder
    under pages/. Files directly in pages/ (no subfolder) get
    DEFAULT_CATEGORY. This is what makes Option C work: drop files
    into pages/<group-name>/ and they're grouped automatically.
    """
    rel = os.path.relpath(filepath, PAGES_DIR)
    parts = rel.split(os.sep)
    if len(parts) <= 1:
        # file sits directly in pages/, no subfolder
        return DEFAULT_CATEGORY
    return humanize(parts[0])


def build_registry():
    if not os.path.isdir(PAGES_DIR):
        print(f"ERROR: pages/ directory not found at {PAGES_DIR}", file=sys.stderr)
        sys.exit(1)

    entries = []
    skipped = []

    # Recursive scan — supports pages/foo.html AND pages/group/foo.html
    html_files = sorted(
        p for p in __import__("pathlib").Path(PAGES_DIR).rglob("*.html")
    )

    for filepath_obj in html_files:
        filepath = str(filepath_obj)
        rel_path = os.path.relpath(filepath, REPO_ROOT).replace(os.sep, "/")

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                html = f.read()
        except Exception as e:
            print(f"WARNING: could not read {rel_path}: {e}", file=sys.stderr)
            continue

        hidden = extract_meta(HIDDEN_RE, html, "").lower() == "true"
        if hidden:
            skipped.append(rel_path)
            continue

        title = extract_title(html, fallback=humanize(filepath_obj.stem))
        description = extract_meta(DESC_RE, html, default="")
        category = extract_meta(CATEGORY_RE, html, default=folder_category(filepath))
        icon = extract_meta(ICON_RE, html, default=DEFAULT_ICON)
        order_raw = extract_meta(ORDER_RE, html, default="")
        try:
            order = int(order_raw) if order_raw else 999
        except ValueError:
            order = 999

        mtime = os.path.getmtime(filepath)
        modified = datetime.fromtimestamp(mtime, tz=timezone.utc).strftime("%Y-%m-%d")

        entries.append({
            "title": title,
            "description": description,
            "category": category,
            "icon": icon,
            "order": order,
            "path": rel_path,
            "modified": modified,
        })

    # Sort: category alphabetically, then explicit order, then title alphabetically
    entries.sort(key=lambda e: (e["category"], e["order"], e["title"]))

    registry = {
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "count": len(entries),
        "pages": entries,
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"✓ Registry written to {os.path.relpath(OUTPUT_PATH, REPO_ROOT)}")
    print(f"✓ {len(entries)} page(s) indexed" + (f", {len(skipped)} hidden" if skipped else ""))
    for e in entries:
        print(f"   [{e['category']}] {e['icon']} {e['title']}  →  {e['path']}")
    if skipped:
        for s in skipped:
            print(f"   [hidden] {s}")


if __name__ == "__main__":
    build_registry()
