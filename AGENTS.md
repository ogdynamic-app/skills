# AGENTS.md

This repo distributes agent **skills** for [ogdynamic](https://ogdynamic.com), the OG image platform. It is not an application codebase — there is nothing to build or test here; keep edits limited to skill content.

## The skill

- [`ogdynamic-canvas/SKILL.md`](ogdynamic-canvas/SKILL.md) — designing ogdynamic canvases (OG/social images): document format, validation limits, fonts, flex-first layout, dynamic overrides, renders. **Read it before authoring or editing any canvas `items` tree.**
- [`ogdynamic-canvas/schema.json`](ogdynamic-canvas/schema.json) — machine-readable contract (every style property, enum, and cap). Validate documents against it before sending them to any tool.
- `ogdynamic-canvas/scripts/fonts.py` — font checker. `fontFamily` must be an exact registered family from <https://cdn.ogdynamic.com/fonts/index.json>; verify with `check "<Family>"` (exit 1 = not registered).

## Working in this repo

- The canvas contract mirrors the ogdynamic app (Laravel) and its Rust render service. When those change, update the skill here and sync `resources/skills/canvas/SKILL.md` in the app repo.
- Keep `SKILL.md` token-lean; put exhaustive data in `schema.json` or the scripts, not prose.
- Rendering-engine details (supported CSS, fonts) are verified against the render service source when in doubt — do not guess CSS behavior.

## Installing the skill (per platform)

| Platform | Install |
| --- | --- |
| Claude Code | `/plugin marketplace add ogdynamic-app/skills`, then `/plugin install ogdynamic@ogdynamic` |
| ZCode | Plugin Marketplace → Add marketplace → `ogdynamic-app/skills` |
| Gemini CLI | `gemini extensions install https://github.com/ogdynamic-app/skills` |
| Codex CLI | `npx skills add ogdynamic-app/skills --skill ogdynamic-canvas -a codex` (or copy into `~/.codex/skills/`) |
| ChatGPT | upload the `ogdynamic-canvas/` folder as a skill via ChatGPT's build-skills flow (same Agent Skills standard) |
| Any agent (skills CLI) | `npx skills add ogdynamic-app/skills --skill ogdynamic-canvas` |
| Manual | copy `ogdynamic-canvas/` into the agent's skills directory (`.agents/skills/`) |
