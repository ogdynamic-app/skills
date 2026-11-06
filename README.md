# ogdynamic-skills

Agent skills for [**ogdynamic**](https://ogdynamic.com/), the OG image platform. They teach AI agents how to design canvases and generate OG images for ogdynamic users.

## Skills

| Skill    | Path                          | For                 | What it covers                                                                                                                                                          |
| -------- | ----------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ogdynamic-canvas` | [`ogdynamic-canvas/`](ogdynamic-canvas/SKILL.md) | ogdynamic app users | Designing canvases and OG images: starting from templates, editing designs, fonts, colors, layouts, dynamic content, and publishing. `SKILL.md` carries 50 popular fonts with weights; bundled `scripts/fonts.mjs` / `scripts/fonts.py` check any other family against the full registered set (`cdn.ogdynamic.com/fonts/index.json`), and `schema.json` holds every style option and size limit. |

## Installing

### As a plugin (marketplace)

This repo is a plugin marketplace — add it once, install the plugin, and every skill in it lands in your agent. In Claude Code (or the ZCode plugin panel), click **Add marketplace** and enter the GitHub repo `ogdynamic-app/skills`, or run:

```
/plugin marketplace add ogdynamic-app/skills
```

Then install the plugin (UI: **marketplace → ogdynamic → Install**, or):

```
/plugin install ogdynamic@ogdynamic
```

Updates to this repo reach installed users through the marketplace's plugin update.

### With the skills CLI

Requires Node.js 22.20+. From your project root:

```bash
# Interactive — pick the skills and the agents to install them to
npx skills add ogdynamic-app/skills

# Just the canvas skill
npx skills add ogdynamic-app/skills --skill ogdynamic-canvas

# Target a specific agent, e.g. Claude Code
npx skills add ogdynamic-app/skills --skill ogdynamic-canvas -a claude-code

# Install globally (available across projects) instead of the current project
npx skills add ogdynamic-app/skills --skill ogdynamic-canvas -g
```

### Manually

Each skill is a folder with a `SKILL.md` inside. Copy or symlink the folder into your agent's skills directory — `.agents/skills/` for the current project, `~/.agents/skills/` for all projects.
