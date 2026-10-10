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

3. **Determine the target** = 15, the schema this plugin installs, or the highest entry in the changelog below if that is higher. If current ≥ target: report "already up to date (vN)" and stop.

4. **Plan.** For each version from current+1 up to target, gather that entry's steps in order. Present one migration plan grouped by version, naming the exact files and notes each step touches. Wait for my confirmation.

5. **Apply** confirmed steps in version order. Never delete an item note or a Pocket note. Bump `updated` only on notes whose content actually changes. When a step says to take a file *verbatim from the plugin*, copy it byte for byte from `${CLAUDE_PLUGIN_ROOT}/vault/` — never rewrite it from the changelog's description.

6. **Bump the marker.** Set `Schema version:` in `CLAUDE.md` to the target.

7. **Log.** Append to `GTD/Log.md`: one `YYYY-MM-DD HH:MM [migrate] vX → vY: <summary>` line per version applied (add a count of notes touched when the batch is large).

8. **Report** what changed and the version the vault is now on.

## Changelog (oldest first)

Migrations up to v15 are in the repo's `update.md` (step 2). v15 is the first schema the plugin installs.
