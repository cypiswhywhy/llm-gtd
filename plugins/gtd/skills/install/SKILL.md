---
name: install
description: Set up LLM-GTD in the current Obsidian vault — the GTD board, Pocket board, schema, templates and clipper templates. Use when the user runs /gtd:install or asks to install or set up GTD in this vault.
disable-model-invocation: true
---

# Install LLM-GTD into this vault

Set up a GTD (Getting Things Done) system in this Obsidian vault, following the "llm-wiki" idea (https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f): I capture and decide, you do the bookkeeping. Next to it, set up **Pocket** — a separate board for content I want to keep once its GTD task is done.

Every file comes from `${CLAUDE_PLUGIN_ROOT}/vault/`. Copy each one **byte for byte** — don't improvise on the schema, don't reword, don't reformat.

## Before you touch anything — existing-vault safety

This vault may already contain notes. **Never overwrite or delete existing content.** First check what's already there and adapt:

- **`CLAUDE.md` at the root** — if it already exists, do NOT replace it. Append `vault/CLAUDE.md` to it as a clearly separated section, preserving everything already in the file. If it already contains `# LLM-GTD — vault schema`, the vault is installed: STOP and point me at `/gtd:update`.
- **`README.md` at the root** — if it already exists, do NOT replace it. Append `vault/README.md` to it.
- **`GTD/`, `Pocket/`, `Templates/GTD Item.md`, `Templates/Pocket Note.md`, `clipper/gtd-clipper-template.json`, `clipper/pocket-clipper-template.json`** — if any of these already exist, STOP and report the collision instead of overwriting. Ask me how to proceed (rename, merge, or skip). Only create the ones that are absent.
- **`.claude/skills/gtd-*`** — the skills of an install made before the plugin. If any exist, STOP and point me at `/gtd:update` instead: this vault needs migrating, not installing.
- **`Templates/`** — this folder may already exist and hold other templates; add `GTD Item.md` and `Pocket Note.md` alongside them, don't disturb the rest.
- Do not read, move, retag, or modify any pre-existing note outside `GTD/` and `Pocket/` at any point.

Report which of the files below already existed and how you handled each before writing anything.

## Files

| From `${CLAUDE_PLUGIN_ROOT}/vault/` | To the vault root |
|---|---|
| `CLAUDE.md` | `CLAUDE.md` (append if it exists) |
| `README.md` | `README.md` (append if it exists) |
| `Templates/GTD Item.md` | `Templates/GTD Item.md` |
| `GTD/Board.base` | `GTD/Board.base` |
| `GTD/Log.md` | `GTD/Log.md` |
| `clipper/gtd-clipper-template.json` | `clipper/gtd-clipper-template.json` |
| `Pocket/Board.base` | `Pocket/Board.base` |
| `Templates/Pocket Note.md` | `Templates/Pocket Note.md` |
| `clipper/pocket-clipper-template.json` | `clipper/pocket-clipper-template.json` |

## Also create

- Empty folders `GTD/Items/`, `GTD/Projects/`, `GTD/Archive/` and `Pocket/Notes/` (add one placeholder item in `GTD/Items/` from the template so I can see the format — fill in the Templater expressions yourself: today's date, and minus the current time in milliseconds for `kanban_order`).
- **Nothing in `.obsidian/`.** Do not create CSS snippets and do not edit `appearance.json` or any other Obsidian config — the `Base Board` plugin needs no styling help from us.
- Log the initial setup as the first line after the `---` in `GTD/Log.md`: `YYYY-MM-DD HH:MM [capture] Vault initialized (schema v15): boards, templates, schema created.`

## Report

Say what you made, then tell me the one step no prompt can do, because it lives in Obsidian's own plugin settings: Settings → Templater → turn on **Trigger Templater on new file creation**, then under **Folder Templates** add folder `GTD/Items` → template `Templates/GTD Item.md`. Never attempt it yourself.

Before writing anything, confirm you understand the schema, then create all of the above in one pass.
