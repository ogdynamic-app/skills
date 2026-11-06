#!/usr/bin/env python3
"""Font checker for the ogdynamic canvas skill.

The render service registers a large font set
(https://cdn.ogdynamic.com/fonts/index.json); this tool verifies a family
exists before you put it in a `fontFamily` style. Python twin of fonts.mjs —
same commands and exit codes, stdlib only.

Usage:
  python3 fonts.py check "Space Grotesk"         exact / case-insensitive / slug match
  python3 fonts.py check "Inter" "JetBrains Mono"  check several at once
  python3 fonts.py search mono                   substring search (name + slug)
  python3 fonts.py list                          every registered family, compact
  python3 fonts.py count                         how many families are registered
Options:
  --file <path>   read the index from a local JSON file instead of the CDN
"""

import json
import sys
import urllib.request
from pathlib import Path

INDEX_URL = "https://cdn.ogdynamic.com/fonts/index.json"


def load_index(file: str | None) -> list[dict]:
    if file:
        text = Path(file).read_text(encoding="utf-8")
    else:
        request = urllib.request.Request(
            INDEX_URL, headers={"Accept": "application/json", "User-Agent": "ogdynamic-canvas-skill"}
        )
        with urllib.request.urlopen(request, timeout=30) as response:
            text = response.read().decode("utf-8")
    data = json.loads(text)
    if not isinstance(data.get("fonts"), list):
        raise ValueError('unexpected index shape: missing "fonts"')
    return data["fonts"]


def fmt_weights(weights: list[int]) -> str:
    ordered = sorted(weights)
    parts: list[list[int]] = []
    run = [ordered[0]]
    for current in ordered[1:]:
        if current == run[-1] + 100:
            run.append(current)
        else:
            parts.append(run)
            run = [current]
    parts.append(run)
    out = []
    for chunk in parts:
        out.append(f"{chunk[0]}-{chunk[-1]}" if len(chunk) > 2 else ", ".join(map(str, chunk)))
    return ", ".join(out)


def describe(font: dict) -> str:
    lines = [f"{font['name']} — registered ({'variable' if font['variable'] else 'static'})"]
    lines.append(f"  weights: {fmt_weights(font['weights'])}")
    faces = font.get("faces") or []
    extra = [w for w in faces if w not in font["weights"]]
    if extra:
        lines.append(f"  extra static faces: {fmt_weights(extra)} (usable beyond the weights list)")
    return "\n".join(lines)


def main() -> None:
    argv = sys.argv[1:]
    file: str | None = None
    positional: list[str] = []
    i = 0
    while i < len(argv):
        if argv[i] == "--file":
            i += 1
            if i >= len(argv):
                die("--file requires a path")
            file = argv[i]
        else:
            positional.append(argv[i])
        i += 1

    if not positional:
        die("Usage: python3 fonts.py <check|search|list|count> [args] [--file <path>]")

    cmd, rest = positional[0], positional[1:]
    fonts = load_index(file)
    by_name = {f["name"].lower(): f for f in fonts}
    by_slug = {f["slug"]: f for f in fonts}

    if cmd == "check":
        if not rest:
            die('check requires at least one family name, e.g. check "Space Grotesk"')
        missing = 0
        for query in rest:
            key = query.lower().strip()
            hit = by_name.get(key) or by_slug.get(key.replace(" ", "-"))
            if hit:
                print(describe(hit))
            else:
                missing += 1
                first = key.split(" ")[0]
                near = [f["name"] for f in fonts if first in f["name"].lower()][:5]
                suffix = f". Closest: {', '.join(near)}" if near else ""
                print(f'"{query}" — NOT registered{suffix}')
            print()
        sys.exit(1 if missing else 0)

    if cmd == "search":
        term = (rest[0] if rest else "").lower().strip()
        if not term:
            die("search requires a term, e.g. search mono")
        hits = [f for f in fonts if term in f["name"].lower() or term in f["slug"]]
        if not hits:
            print(f'no family matches "{term}"')
            sys.exit(1)
        for f in hits:
            print(f"{f['name']} ({fmt_weights(f['weights'])})")
        sys.exit(0)

    if cmd == "list":
        print(", ".join(f["name"] for f in fonts))
        sys.exit(0)

    if cmd == "count":
        print(f"{len(fonts)} registered families")
        sys.exit(0)

    die(f'unknown command "{cmd}" — use check, search, list, or count')


def die(message: str) -> None:
    print(message, file=sys.stderr)
    sys.exit(2)


if __name__ == "__main__":
    main()
