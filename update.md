# Updating an existing LLM-GTD vault

A self-contained prompt for bringing a vault that **already has LLM-GTD installed** up to the current schema. Paste it into Claude Code at the vault's root. It detects the vault's schema version, applies only the migrations it's missing, refreshes the in-vault `/gtd-update` skill, and does all of it non-destructively — propose-then-apply, logged, nothing outside `GTD/` touched.

- **Brand-new vault?** Use [`install.md`](install.md) instead — this prompt assumes an install is already present.
- **Day to day**, the installed `/gtd-update` skill does the same job from inside the vault. This file is the canonical, always-latest copy of the changelog, and it also creates/repairs that skill (vaults installed before the skill existed won't have it).

No plugins or manual steps are needed to update — the six community plugins from `install.md` are already enabled.

## The prompt

Open a terminal at the vault's root, run Claude Code, and paste this in:

---

Bring this existing LLM-GTD Obsidian vault up to the latest schema version. It already has an LLM-GTD system installed (a `CLAUDE.md` schema, a `GTD/` folder with a board, a template, a clipper template, and skills). Do NOT reinstall from scratch, and do NOT read, move, retag, or modify any note outside `GTD/`. Migrate in place, propose before you apply, and log everything.

## How versioning works

The vault's current schema version is the integer after `Schema version:` in the root `CLAUDE.md`. If that marker is absent, treat the vault as **version 1** (the original release, before versioning) and add the marker as part of the migration. The latest version is the highest entry in the changelog below.

## What to do

1. **Detect** the current version from `CLAUDE.md` (`Schema version: N`; absent → 1) and the target = the highest version in the changelog below.
2. **The migration logic and the full changelog are the `gtd-update` skill printed at the end of this prompt.** Read it and follow it against this vault: plan every step for versions `current+1 … target`, present the plan grouped by version (naming the exact files and notes each step touches), and wait for my confirmation before writing.
3. **Apply** confirmed steps in version order. Never delete an item note. Bump `updated` only on notes whose content actually changes.
4. **Bump the marker** in `CLAUDE.md` to the target version (add the `Schema version:` line if it was absent).
5. **Install/refresh the skill.** Create or overwrite `.claude/skills/gtd-update/SKILL.md` with the exact content printed at the end of this prompt, so the vault carries the current changelog for next time.
6. **Log.** Append to `GTD/Log.md`: one `YYYY-MM-DD HH:MM [migrate] vX → vY: <summary>` line per version applied (add a count of notes touched when the batch is large).
7. **Report** what changed and anything I should double-check. If the vault is already at the target, say "already up to date (vN)" — but still make sure the `/gtd-update` skill exists and matches the content below (create it if missing).

## The `/gtd-update` skill — the source of truth for migrations

Follow this to migrate the vault, then write it verbatim to `.claude/skills/gtd-update/SKILL.md`:

    ---
    name: gtd-update
    description: Bring this LLM-GTD vault up to the current schema version — apply any pending schema migrations to frontmatter, the board, template, clipper, and skills. Use when the schema changed, after pulling a new version of the scripts, or when something references a `done`/legacy field that no longer fits the schema.
    ---

    # GTD schema migration

    Reconcile this vault to the latest LLM-GTD schema version. Follow the propose-then-apply rule in `CLAUDE.md` and never touch notes outside `GTD/`.

    ## How versioning works

    The vault's current version is the integer after `Schema version:` in the root `CLAUDE.md`. If that marker is absent, treat the vault as **version 1** (the original release, before versioning). The latest version this skill knows is the highest entry in the changelog below.

    ## Steps

    1. **Read the current version** from `CLAUDE.md` (`Schema version: N`; absent → 1).
    2. **Determine the target** = the highest version in the changelog below. If current ≥ target: report "already up to date (vN)" and stop.
    3. **Plan.** For each version from current+1 up to target, gather that entry's steps in order. Present one migration plan grouped by version, naming the exact files and notes each step touches. Wait for my confirmation.
    4. **Apply** confirmed steps in version order. Never delete an item note. Bump `updated` only on notes whose content actually changes.
    5. **Bump the marker.** Set `Schema version:` in `CLAUDE.md` to the target (add the marker line if it was absent).
    6. **Log.** Append to `GTD/Log.md`: one `YYYY-MM-DD HH:MM [migrate] vX → vY: <summary>` line per version applied (add a count of notes touched when the batch is large).
    7. **Report** what changed and anything I should eyeball.

    If the repo's `update.md` advertises a version higher than the top of this changelog, this skill is stale — run `update.md` instead (it migrates the vault *and* refreshes this skill).

    ## Changelog (oldest first; the canonical copy lives in the repo's `update.md`)

    ### v1 → v2 — drop the redundant `done` field (status is the single source of truth)

    The old schema carried a `done: false` boolean beside `status`. The kanban plugin can't bind a card checkbox to a column, so it never moved cards and only drifted out of sync. v2 removes it: an item is done when `status: done` (drag the card to the Done column).

    1. **Item + archive notes** — in every note under `GTD/Items/` and `GTD/Archive/`, delete the `done:` frontmatter line. Change nothing else.
    2. **`Templates/GTD Item.md`** — delete the `done: false` line.
    3. **`GTD/Board.base`** — delete the `note.done` property block; in the kanban view's `order:` list delete the `- done` entry. KEEP the `- done` under `columnOrders` — that is the Done *column*, not the field.
    4. **`clipper/gtd-clipper-template.json`** — delete the `{ "name": "done", ... }` object from `properties`.
    5. **`.claude/skills/gtd-review/SKILL.md`** — delete the "Done sync" check, renumber the remaining checks, and remove "sync done checkboxes" from the `description`.
    6. **`CLAUDE.md`** — delete the `done:` frontmatter line and its comment; add the "single source of truth / drag to the Done column" notes; remove "sync `done`," from the review operation line.

    ### v2 → v3 — cleaner kanban cards + auto-frontmatter for hand-made items

    Two fixes. (1) The kanban card printed the note name twice — once as the card title, once as a `file.name` property — and prefixed every property with its label (`Tags: ...`). (2) Notes created by hand in `GTD/Items/` (not via the template or web clipper) were missing `created`/`source`.

    Changes to apply:

    1. **`GTD/Board.base`** — in the **kanban view's** `order:` list, delete the `- file.name` line (keep `- tags`). The card already shows the note name as its title, so `file.name` there rendered it a second time. Do NOT touch the table views' `order:` lists — those still need `file.name` as a column.
    2. **`.claude/skills/gtd-triage/SKILL.md`** — add frontmatter backfill when processing the inbox: if an item is missing `created`, set it to the note's file-creation date (fall back to today); if the `source` key is absent, add an empty `source:`. Hand-made notes then self-heal to the schema at triage time.
    3. **`.obsidian/snippets/gtd-kanban.css`** — create it containing `.obk-card-property-label { display: none; }`, then enable it by adding `"gtd-kanban"` to the `enabledCssSnippets` array in `.obsidian/appearance.json` (create the file and/or the array if absent; **preserve every other key and any snippets already listed** — read-modify-write, don't overwrite). This hides the property-name labels so cards read `tag1 tag2` instead of `Tags: tag1 tag2` — the `kanban-bases-view` plugin always draws the label, so CSS is the only way. **This is the one place llm-gtd writes outside `GTD/`.** After applying, tell the user to reload Obsidian (Ctrl/Cmd+R or reopen the vault) for it to take effect, and warn that if Obsidian was running during the migration it may rewrite `appearance.json` on exit — in which case the snippet just needs enabling once in Settings → Appearance → CSS snippets.
    4. **`CLAUDE.md`** — note in the capture operation that new notes get frontmatter from the Templater folder-template (manual step below) and that triage backfills any item missing `created`/`source`; add `.obsidian/snippets/gtd-kanban.css` to the Layout as the one file written outside `GTD/`; and nuance the "don't touch `.obsidian/`" rule so it allows creating/enabling this snippet during `/gtd-update`.

    Manual step to REPORT to the user (it lives in `.obsidian/` plugin config and can't be scripted reliably — tell the user, don't attempt it):

    - **Auto-fill new notes:** Settings → Templater → enable "Trigger Templater on new file creation", then add a Folder Template mapping `GTD/Items` → `Templates/GTD Item.md`. Every note created in `GTD/Items/` then gets the schema frontmatter automatically.

---

Before applying anything, confirm the vault's current version and the target, then show me the plan.

---

## Adding a future migration

When the schema changes again, append a new `### vN → vN+1` entry to the changelog **in two places, kept identical**: the `## The /gtd-update skill` block in this file, and section 8 of [`install.md`](install.md) (and its mirror in `install.html`). Bump the `Schema version:` number in the `install.md` / `install.html` schema so fresh installs start at the new latest. Existing vaults then pick the change up by running this prompt (or `/gtd-update` once their skill has been refreshed).
