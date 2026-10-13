---
name: update
description: Bring this LLM-GTD vault up to the current schema version — apply any pending migrations to frontmatter, the boards, templates, clipper templates and CLAUDE.md. Use when the schema changed, after updating the gtd plugin, or when something references a field that no longer fits the schema.
---

# GTD schema migration

Reconcile this vault to the schema this plugin ships. Follow the propose-then-apply rule in `CLAUDE.md` and never touch notes outside `GTD/` and `Pocket/`.

The skills themselves need no migrating: they come from the plugin, and updating the plugin updates them. This skill moves only what lives in the vault.

## Steps

1. **Read the vault version** from `CLAUDE.md` (`Schema version: N`; absent → 1).

2. **Older than v15?** The vault predates the plugin. Its migrations live in the repo's `update.md`: fetch https://raw.githubusercontent.com/cypiswhywhy/llm-gtd/main/update.md and follow that prompt instead of this skill — it ends at v15. Then come back here for anything newer.

3. **Determine the target** = the highest version in the changelog below. If current ≥ target: report "already up to date (vN)" and stop.

4. **Plan.** For each version from current+1 up to target, gather that entry's steps in order. Present one migration plan grouped by version, naming the exact files and notes each step touches. Wait for my confirmation.

5. **Apply** confirmed steps in version order. Never delete an item note or a Pocket note. Bump `updated` only on notes whose content actually changes. When a step says to take a file *verbatim from the plugin*, copy it byte for byte from `${CLAUDE_PLUGIN_ROOT}/vault/` — never rewrite it from the changelog's description.

6. **Bump the marker.** Set `Schema version:` in `CLAUDE.md` to the target.

7. **Log.** Append to `GTD/Log.md`: one `YYYY-MM-DD HH:MM [migrate] vX → vY: <summary>` line per version applied (add a count of notes touched when the batch is large).

8. **Report** what changed and the version the vault is now on.

## Changelog (oldest first)

Migrations up to v15 are in the repo's `update.md` (step 2). v15 is the first schema the plugin installs.

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
