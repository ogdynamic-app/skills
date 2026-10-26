# ogdynamic-skills

Agent skills for the [ogdynamic](https://github.com/mehedihasan/ogdynamic) OG image platform — the document contracts, authoring rules, and tool workflows agents need to design and render images correctly.

## Skills

| Skill    | Path             | What it covers                                                                                                        |
| -------- | ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| `canvas` | [`canvas/`](canvas/SKILL.md) | The canvas document format (Fill, CanvasNode, NodeStyle), the validation contract, fonts, dynamic-layer overrides, renders vs public URLs, and the MCP tool workflow |

## Installing

### With the skills CLI

Requires Node.js 22.20+. From your project root:

```bash
# Interactive — pick the skills and the agents to install them to
npx skills add ogdynamic-app/skills

# Just the canvas skill
npx skills add ogdynamic-app/skills --skill canvas

# Target a specific agent, e.g. Claude Code
npx skills add ogdynamic-app/skills --skill canvas -a claude-code

# Install globally (available across projects) instead of the current project
npx skills add ogdynamic-app/skills --skill canvas -g
```

### Manually

Point your agent at a skill directory (each contains a `SKILL.md` with YAML frontmatter):

- **ZCode / Claude Code / most agents**: copy or symlink the skill folder into `.agents/skills/` (project) or `~/.agents/skills/` (user) — e.g. `ln -s "$PWD/canvas" .agents/skills/canvas`.
- **ogdynamic MCP clients**: the app serves the canvas skill at `skill://canvas/SKILL.md` (from `resources/skills/canvas/SKILL.md` in the app repo). When the contract changes here, sync that copy.

## Source of truth

The canvas contract is defined in the ogdynamic app: validation rules (`app/Rules/CanvasFill.php`, `app/Rules/CanvasItems.php`), the render service (`ogdynamic-rs`), and the feature docs (`docs/canvas/`). Skills in this repo describe that contract — they never redefine it. When the app changes, update the skill here first, then sync.
