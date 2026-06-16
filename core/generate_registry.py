from pathlib import Path
import json
import re

# path to this script
ROOT = Path(__file__).resolve().parent

# repo structure
PAGES_DIR = ROOT.parent / "pages"
OUTPUT_FILE = ROOT / "pages.json"

pages = []

for f in PAGES_DIR.glob("*.html"):

    txt = f.read_text(
        encoding="utf-8",
        errors="ignore"
    )

    match = re.search(
        r"<title>(.*?)</title>",
        txt,
        re.I | re.S
    )

    title = (
        match.group(1).strip()
        if match
        else f.stem
            .replace("_", " ")
            .title()
    )

    pages.append({
        "title": title,
        "file": f.name
    })

pages.sort(
    key=lambda x:
    x["title"].lower()
)

OUTPUT_FILE.write_text(
    json.dumps(
        pages,
        indent=2
    ),
    encoding="utf-8"
)

print(
    f"Generated "
    f"{OUTPUT_FILE}"
)
print(
    f"Found "
    f"{len(pages)} pages"
)
