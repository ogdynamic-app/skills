#!/usr/bin/env node
// Font checker for the ogdynamic canvas skill.
//
// The render service registers a large font set (https://cdn.ogdynamic.com/fonts/index.json);
// this tool verifies a family exists before you put it in a `fontFamily` style.
//
// Usage:
//   node fonts.mjs check "Space Grotesk"      exact / case-insensitive / slug match
//   node fonts.mjs check "Inter" "JetBrains Mono"   check several at once
//   node fonts.mjs search mono                substring search (name + slug)
//   node fonts.mjs list                       every registered family, compact
//   node fonts.mjs count                      how many families are registered
// Options:
//   --file <path>   read the index from a local JSON file instead of the CDN

const INDEX_URL = "https://cdn.ogdynamic.com/fonts/index.json";

function parseArgs(argv) {
  const args = { file: null, positional: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--file") {
      args.file = argv[++i];
      if (!args.file) throw new Error("--file requires a path");
    } else {
      args.positional.push(argv[i]);
    }
  }
  return args;
}

async function loadIndex(file) {
  const text = file
    ? (await import("node:fs")).readFileSync(file, "utf8")
    : await (await fetch(INDEX_URL, { headers: { accept: "application/json" } })).text();
  const data = JSON.parse(text);
  if (!Array.isArray(data.fonts)) throw new Error('unexpected index shape: missing "fonts"');
  return data.fonts;
}

function fmtWeights(weights) {
  const sorted = [...weights].sort((a, b) => a - b);
  const parts = [];
  let run = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 100) {
      run.push(sorted[i]);
    } else {
      parts.push(run);
      run = [sorted[i]];
    }
  }
  parts.push(run);
  return parts
    .map((r) => (r.length > 2 ? `${r[0]}-${r[r.length - 1]}` : r.join(", ")))
    .join(", ");
}

function describe(font) {
  const lines = [`${font.name} — registered (${font.variable ? "variable" : "static"})`];
  lines.push(`  weights: ${fmtWeights(font.weights)}`);
  if (Array.isArray(font.faces) && font.faces.length > 0) {
    const staticFaces = font.faces.filter((w) => !font.weights.includes(w));
    if (staticFaces.length > 0) {
      lines.push(
        `  extra static faces: ${fmtWeights(staticFaces)} (usable beyond the weights list)`,
      );
    }
  }
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [cmd, ...rest] = args.positional;

  if (!cmd) {
    console.error("Usage: node fonts.mjs <check|search|list|count> [args] [--file <path>]");
    process.exit(2);
  }

  const fonts = await loadIndex(args.file);
  const byName = new Map(fonts.map((f) => [f.name.toLowerCase(), f]));
  const bySlug = new Map(fonts.map((f) => [f.slug, f]));

  switch (cmd) {
    case "check": {
      if (rest.length === 0) {
        console.error('check requires at least one family name, e.g. check "Space Grotesk"');
        process.exit(2);
      }
      let missing = 0;
      for (const query of rest) {
        const key = query.toLowerCase().trim();
        const hit = byName.get(key) ?? bySlug.get(key.replaceAll(" ", "-"));
        if (hit) {
          console.log(describe(hit));
        } else {
          missing++;
          const near = fonts
            .filter((f) => f.name.toLowerCase().includes(key.split(" ")[0]))
            .slice(0, 5)
            .map((f) => f.name);
          console.log(`"${query}" — NOT registered${near.length ? `. Closest: ${near.join(", ")}` : ""}`);
        }
        console.log("");
      }
      process.exit(missing > 0 ? 1 : 0);
    }

    case "search": {
      const term = (rest[0] ?? "").toLowerCase().trim();
      if (!term) {
        console.error("search requires a term, e.g. search mono");
        process.exit(2);
      }
      const hits = fonts.filter(
        (f) => f.name.toLowerCase().includes(term) || f.slug.includes(term),
      );
      if (hits.length === 0) {
        console.log(`no family matches "${term}"`);
        process.exit(1);
      }
      for (const f of hits) console.log(`${f.name} (${fmtWeights(f.weights)})`);
      process.exit(0);
    }

    case "list": {
      console.log(fonts.map((f) => f.name).join(", "));
      process.exit(0);
    }

    case "count": {
      console.log(`${fonts.length} registered families`);
      process.exit(0);
    }

    default:
      console.error(`unknown command "${cmd}" — use check, search, list, or count`);
      process.exit(2);
  }
}

main().catch((err) => {
  console.error(String(err?.message ?? err));
  process.exit(2);
});
