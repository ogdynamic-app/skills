# ogdynamic-skills

Agent skills for [**ogdynamic**](https://ogdynamic.com/), the OG image platform. They teach AI agents how to design canvases and generate OG images for ogdynamic users.

## Skills

| Skill    | Path                          | For                 | What it covers                                                                                                                                                          |
| -------- | ----------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `canvas` | [`canvas/`](canvas/SKILL.md)  | ogdynamic app users | Designing canvases and OG images: starting from templates, editing designs, fonts, colors, layouts, dynamic content, and publishing. Everything an agent needs is in the single `SKILL.md` — the full font list with weights, every style option with accepted values, and all size limits included. |

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

Each skill is a folder with a `SKILL.md` inside. Copy or symlink the folder into your agent's skills directory — `.agents/skills/` for the current project, `~/.agents/skills/` for all projects.
