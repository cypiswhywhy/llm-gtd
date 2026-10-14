---
name: update
description: Bring this LLM-GTD vault up to the current schema version — apply any pending migrations to frontmatter, the boards, templates, clipper templates and CLAUDE.md. Use when the schema changed, after updating the gtd plugin, or when something references a field that no longer fits the schema.
---

# GTD schema migration

Reconcile this vault to the schema this plugin ships. Follow the propose-then-apply rule in `CLAUDE.md` and never touch notes outside `GTD/` and `Pocket/`.

The skills themselves need no migrating: they come from the plugin, and updating the plugin updates them. This skill moves only what lives in the vault.

## Steps

1. **Is the plugin itself current?** This skill only knows the migrations of the plugin version it came with, so an old plugin reports "up to date" while a newer schema exists. Compare `version` in `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json` with `version` in https://raw.githubusercontent.com/cypiswhywhy/llm-gtd/main/plugins/gtd/.claude-plugin/plugin.json. If the fetch fails, say so and go on. If GitHub has a newer version, stop here and offer to update the plugin. On a yes, run from the vault folder:

   ```sh
   claude plugin marketplace update llm-gtd
   claude plugin update gtd@llm-gtd --scope project
   ```

   Then tell me, in these words or close: *"The plugin is updated. Close Claude Code (type `/exit`), start it again in this vault (`claude`), and run `/gtd:update` once more."* A new plugin version only loads in a new session, so don't go on to the steps below. If a command fails, show its error and give me the same two commands to type myself, each prefixed with `!`.

2. **Read the vault version** from `CLAUDE.md` (`Schema version: N`; absent → 1).

3. **Older than v15?** The vault predates the plugin. Its migrations live in the repo's `update.md`: fetch https://raw.githubusercontent.com/cypiswhywhy/llm-gtd/main/update.md and follow that prompt instead of this skill — it ends at v15. Then come back here for anything newer.

4. **Determine the target** = the highest version in the changelog below. If current ≥ target: report "already up to date (vN)" and stop.

5. **Plan.** For each version from current+1 up to target, gather that entry's steps in order. Present one migration plan grouped by version, naming the exact files and notes each step touches. Wait for my confirmation.

6. **Apply** confirmed steps in version order. Never delete an item note or a Pocket note. Bump `updated` only on notes whose content actually changes. When a step says to take a file *verbatim from the plugin*, copy it byte for byte from `${CLAUDE_PLUGIN_ROOT}/vault/` — never rewrite it from the changelog's description.

7. **Bump the marker.** Set `Schema version:` in `CLAUDE.md` to the target.

8. **Log.** Append to `GTD/Log.md`: one `YYYY-MM-DD HH:MM [migrate] vX → vY: <summary>` line per version applied (add a count of notes touched when the batch is large).

9. **Report** what changed and the version the vault is now on.

## Changelog (oldest first)

Migrations up to v15 are in the repo's `update.md` (step 3). v15 is the first schema the plugin installs.

### v15 → v16

Obsidian 1.14 ships its own Bases kanban under the view type `kanban` — the type `Base Board` used — so on 1.14 Obsidian's native kanban draws both boards: tags lose their colors, columns stop collapsing, and Obsidian edits the board files (adds `groupOrder:`, puts `tags` into `order:`). `Base Board` 2.6.0 renamed its view type to `base-board`; this migration points both boards at it. No note is touched and no `kanban_order` changes.

This is the one sanctioned edit to the board files in this migration, despite rule 6 in `CLAUDE.md`. They are not copied from the plugin: each carries the human's own `Base Board` settings (tag colors, column colors, collapsed columns, extra Pocket categories), which a copy would wipe. The edits below are exact and mechanical; keep every other line as found.

1. **Check `Base Board` first.** Read `version` in `.obsidian/plugins/base-board/manifest.json` (read only — never write in `.obsidian/`). If it is older than 2.6.0, or the file is missing, STOP before changing anything and report the manual step: *Settings → Community plugins → update `Base Board` to 2.6.0 or newer, then run `/gtd:update` again.* On an older `Base Board` a `type: base-board` view is an unknown view and the board breaks.

2. **`GTD/Board.base` and `Pocket/Board.base`** — in each file that exists, find the view named `Board`. Leave every other view alone (the table views, and any `type: kanban` view the human added — that may be a native kanban on purpose). In that one view:
   - if it says `type: kanban`, change that line to `type: base-board`. If it already says `type: base-board` (the old `fix-native-kanban.md` prompt did that), leave it;
   - delete a `groupOrder:` block if present — a native-view setting; `Base Board` keeps column order in `boardColumns`;
   - make its `order:` list exactly `- file.name` — `Base Board` draws tags as pills on its own, so a `tags` entry shows every tag twice.

3. **Report a leftover, don't remove it.** If `.obsidian/plugins/base-board/main.js.orig` exists, it is the backup `fix-native-kanban.md` made. Tell the human it is no longer needed and they can delete it; don't delete it yourself.

4. **Report the next step:** reopen both boards in Obsidian. Tags should have their colors back and columns should collapse again.

### v16 → v17

Templater applies a folder template to every note with no body that appears in its folder, and Obsidian counts a note renamed or moved there from outside Obsidian as one. Templater merges the template into the note's frontmatter and the template's values win, so the v16 templates' own `status: inbox`, `created`, `updated` and `kanban_order` overwrote the note's. A card added with the board's `+` to any column landed in `inbox`, and every item `/gtd:triage` renamed with `mv` went back to `inbox` with today's `created` and a fresh `kanban_order`. The v17 templates print only the keys a note lacks, and rule 10 makes every skill re-read what it wrote after a create, rename or move.

1. **`Templates/GTD Item.md` and `Templates/Pocket Note.md`** — replace each with the plugin's file, verbatim. Before replacing, compare the vault's copy with the v16 text (a plain frontmatter block: `status: inbox` or `category:`, `tags: []`, `created`, `updated`, `source:`, `kanban_order`). If it holds anything more, such as a key or a body line the human added, show it and ask before dropping it.
2. **`CLAUDE.md`** — replace the LLM-GTD section (from `# LLM-GTD — vault schema` to the end of its rules) with the plugin's `vault/CLAUDE.md`, verbatim. Before replacing, compare the two: apart from the `Schema version:` line, the two `Templates/` lines under `## Layout`, the paragraph on the Templater templates under `## Item schema`, the capture bullet and rule 10, they should match. If the vault's section holds anything more, show it and ask before dropping it. Everything outside the section stays.
3. **Items the old template reset — propose, don't fix.** Frontmatter alone can't tell a reset item from a real inbox item, but `GTD/Log.md` can. For every item in `GTD/Items/` with `status: inbox`, find its latest `[triage]`, `[project]` or `[fix]` log line by title. If that line gave it another status, list it: title, the status the log gave it, and the log line's date. Propose putting that status back, numbered per rule 9, and apply only the rows I confirm: set `status`, bump `updated`, leave `created` and `kanban_order` as they are, since the old values can't be recovered. Log one `[fix]` line per item restored. If no item matches, say so in one line.
4. **Report the manual step:** *Settings → Templater → Folder Templates → add folder `Pocket/Notes` → template `Templates/Pocket Note.md`* if it isn't there already. Without it, a card from the Pocket board's `+` gets only `category` and `kanban_order`. A `GTD/Items` mapping stays as it is.
