# ogdynamic skills (Gemini CLI extension)

When the user works on ogdynamic canvases, OG images, or social-preview images:

1. Read [`ogdynamic-canvas/SKILL.md`](ogdynamic-canvas/SKILL.md) **before** authoring or editing any canvas `items` tree — it defines the document format, validation limits, fonts, layout rules, and dynamic overrides.
2. `fontFamily` must be an exact registered family. The full list lives at <https://cdn.ogdynamic.com/fonts/index.json>; verify a family (and its weights) with `node ogdynamic-canvas/scripts/fonts.mjs check "<Family>"` or `python3 ogdynamic-canvas/scripts/fonts.py check "<Family>"` (exit 1 = not registered). Popular families with weights are already listed in the SKILL.md.
3. Validate documents against [`ogdynamic-canvas/schema.json`](ogdynamic-canvas/schema.json) before sending them to any tool.
4. Operate canvases through the ogdynamic MCP tools (`list_templates`, `get_canvas`, `create_canvas`, `update_canvas`, `create_render`, …). Full docs: <https://ogdynamic.com/docs>.
