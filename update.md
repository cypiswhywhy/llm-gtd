# Updating an existing LLM-GTD vault

A self-contained prompt for bringing a vault that **already has LLM-GTD installed** up to the current schema. Paste it into Claude Code at the vault's root. It detects the vault's schema version, applies only the migrations it's missing, refreshes the in-vault `/gtd-update` skill, and does all of it non-destructively — propose-then-apply, logged, nothing outside `GTD/` touched.

- **Brand-new vault?** Use [`install.md`](install.md) instead — this prompt assumes an install is already present.
- **Day to day**, the installed `/gtd-update` skill does the same job from inside the vault. This file is the canonical, always-latest copy of the changelog. As of the current skill, `/gtd-update` points a `CANONICAL_SOURCE` at *this file* and checks it on every run, so once a vault has been through this prompt once it can detect newer versions on its own (and self-refresh) instead of going stale. Running this prompt also creates/repairs the skill for vaults installed before it existed.

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
5. **Install/refresh the skill.** Create or overwrite `.claude/skills/gtd-update/SKILL.md` with the exact content printed at the end of this prompt, so the vault carries the current changelog for next time. **Seed the self-check:** the skill's `CANONICAL_SOURCE:` line already ships pointing at the repo's public raw `update.md` — keep that value as-is unless I tell you otherwise (I'd want a local path like `~/devel/llm-gtd/update.md` only if I'm offline or want unpushed migrations to count). This is what lets a future `/gtd-update` detect a newer version on its own instead of going stale.
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

    The vault's current version is the integer after `Schema version:` in the root `CLAUDE.md` (absent → **version 1**, the original release before versioning). The migrations this skill can apply are in the changelog at the bottom — but this skill is a *snapshot* from when it was installed, so newer migrations may exist in the repo. Before planning, it checks a canonical source for a fresher changelog and self-refreshes if there is one, so `/gtd-update` never silently misses a newer version.

    ## Canonical source (latest-version self-check)

    CANONICAL_SOURCE: https://raw.githubusercontent.com/cypiswhywhy/llm-gtd/main/update.md

    The always-latest copy of this skill and its changelog lives in the [llm-gtd repo](https://github.com/cypiswhywhy/llm-gtd)'s `update.md`. `CANONICAL_SOURCE` says where to find it — that's how `/gtd-update` learns about migrations authored *after* this skill was installed. It ships pointing at the public raw URL above, so the self-check works with no setup. Two forms work:

    - **A public raw URL** — the default, and preferred: it works on any machine, needs no clone, and sees changes the moment they're pushed. Use the `raw.` host; a `github.com/...` link serves an HTML page, not the file.
    - **A local file path** to a clone's copy — e.g. `~/devel/llm-gtd/update.md`. Switch to this when you're offline, or when you want the check to see migrations you've written but not yet pushed. Requires the clone to be present and pulled.

    Change it whenever you like — future runs check whatever it points at.

    ## Steps

    1. **Read the vault version** from `CLAUDE.md` (`Schema version: N`; absent → 1).

    2. **Self-check for a newer changelog.**
       - If `CANONICAL_SOURCE` is `(unset)`: ask me for it — the public raw URL of the repo's `update.md`, or a local path to my clone's copy (see above). If I give one, write it into the `CANONICAL_SOURCE:` line above so it persists for next time. If I decline, skip to step 3 using the baked-in changelog and warn that the latest-version check was skipped.
       - If `CANONICAL_SOURCE` is set, read it — fetch it if it's a URL, read the file if it's a path:
         - **Reachable, and its highest `### vX → vY` entry is newer than the top of my baked-in changelog** → I'm stale. Use *that file's* changelog (its steps, not mine) for planning and applying. After applying, overwrite this `SKILL.md` with the `gtd-update` skill embedded in that file, then set the `CANONICAL_SOURCE:` line per the relocation rule below.
         - **Reachable but not newer** → I'm current; use my baked-in changelog. Still apply the relocation rule — a repo can move without the schema changing.
         - **Unreachable** (path moved, clone missing, URL 404/private, offline, fetch blocked) → the repo may have **moved**. Say which source failed, ask me for its new location, and if I give one, write it into `CANONICAL_SOURCE:` and retry the read once. If I decline or the retry also fails, fall back to the baked-in changelog, warn that the latest-version check was skipped, and remind me I can run `update.md` manually.

       **Relocation rule** — whenever the canonical file was read successfully, compare the `CANONICAL_SOURCE:` value declared *inside it* against mine:
       - Mine is a **URL** and theirs differs → **adopt theirs**, and say so in the report. This is how a repo announces that it moved: the canonical file is authoritative about where the canon lives.
       - Mine is a **local path** → **keep mine**. A local path is a deliberate override (offline work, testing unpushed migrations) and must survive a refresh.
       - Never revert `CANONICAL_SOURCE` to `(unset)`.

    3. **Determine the target** = the highest version in the changelog now in effect (the canonical one if it was fresher, else baked-in). If current ≥ target: report "already up to date (vN)" — say whether the check reached the canonical source or fell back — and stop.

    4. **Plan.** For each version from current+1 up to target, gather that entry's steps in order. Present one migration plan grouped by version, naming the exact files and notes each step touches. Wait for my confirmation.
    5. **Apply** confirmed steps in version order. Never delete an item note. Bump `updated` only on notes whose content actually changes.
    6. **Bump the marker.** Set `Schema version:` in `CLAUDE.md` to the target (add the marker line if it was absent).
    7. **Log.** Append to `GTD/Log.md`: one `YYYY-MM-DD HH:MM [migrate] vX → vY: <summary>` line per version applied (add a count of notes touched when the batch is large).
    8. **Report** what changed, the effective latest version, and whether the self-check reached the canonical source.

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

    ### v3 → v4 — `/gtd-update` survives the repo moving

    The self-check couldn't cope with the canonical repo changing address. Three holes: a successful refresh re-injected the vault's *old* `CANONICAL_SOURCE` and threw away the new one; an unreachable source only warned and fell back, forever; and neither path did anything unless the schema version had also changed. (llm-gtd moving out of a private monorepo into its own public repo is what surfaced this.)

    This migration touches no vault data. Its only job is to replace the skill, because a change to the skill's *logic* can only travel on a version bump — the self-refresh triggers on a newer changelog entry, so a fix shipped without one would never reach an installed vault.

    1. **`.claude/skills/gtd-update/SKILL.md`** — overwrite it with the current version of this skill: the whole thing, from its frontmatter through the changelog in effect. Set its `CANONICAL_SOURCE:` by the relocation rule in step 2 — if the vault's existing value is a URL that differs from the one this file declares, take this file's; if it's a local path, keep the vault's.
    2. **Nothing else.** No frontmatter, board, template, clipper, or `CLAUDE.md` edits. Don't touch item notes and don't bump `updated` on anything — only the `Schema version:` marker moves.

    ### v4 → v5 — room for an imported system

    The item schema doesn't change. v5 makes space for bulk-loading an existing task system — a Notion "Markdown & CSV" export, or a plain CSV — into `GTD/Items/`: the `GTD/Attachments/` folder for files an import brings with it, and an `[import]` log op.

    The import itself is **a prompt, not a skill**: the repo's `import-notion.md`, pasted into Claude Code at the vault root. Importing happens once per vault, so installing a command into every vault — and then keeping that copy current through schema bumps — costs more than it saves. Nothing to install here, and nothing that can go stale.

    1. **`GTD/Log.md`** — add `[import]` to the `Ops:` line in the header.
    2. **`CLAUDE.md`** — add `GTD/Attachments/  # files an import brought with it — created on demand` to the Layout block, and add an **import** bullet to Operations: "**import** — bulk-load an existing system (a Notion export, a CSV) into `GTD/Items/` by pasting the repo's `import-notion.md` prompt: it surveys the export, proposes a status/tag/field map, then writes. A capture operation — the thinking happens afterwards at triage."
    3. **`README.md`** — if the vault has an `## LLM-GTD` section, add a line noting that `import-notion.md` brings a Notion export or CSV in.
    4. **No item notes are touched**, no `updated` dates move, and `GTD/Attachments/` is not created until an import actually needs it.

    ### v5 → v6 — new kanban plugin (`Base Board`), and the board file stops bloating

    The board moves from `kanban-bases-view` to `Base Board` (`mderazon/obsidian-base-board`), which is actively maintained, renders incrementally, colors tags, and — the reason this is urgent — stores manual card order as a `kanban_order` property **in each note** instead of as a list of note paths inside `Board.base`.

    Under the old plugin, any kanban view without a `groupBy` fell back to grouping by `file.file` and wrote *every note path in the vault* into `columnOrders`. On a 1000-item vault that produced an 88 KB, 1500-line `Board.base` that the plugin re-parsed and re-serialized on every interaction — the direct cause of the board being slow. This migration removes that.

    **Do the manual step FIRST.** Until `Base Board` is installed, a `type: kanban` view renders as an unknown-view error. If the user hasn't installed it yet, report the manual step and stop — do not rewrite `Board.base` and leave them with a broken board.

    1. **`GTD/Board.base`** — rewrite the **kanban view** (the one named `Board`):
       - `type: kanban-view` → `type: kanban`
       - `groupByProperty: note.status` → a `groupBy:` block with `property: status` (**bare**, no `note.` prefix) and `direction: ASC`
       - `columnOrders: { note.status: [...] }` → `boardColumns:` as a **flat list** of the same six values in the same order: `inbox, focus, next, someday, waiting, done`
       - `order:` → **`file.name` only**. Delete `- tags`: `Base Board` renders tags as their own colored pills regardless of `order:`, so leaving it listed prints every tag twice. `file.name` is not drawn as a chip and must be present — the plugin re-inserts it on every render and rewrites the file if it's missing.
       - `quickAddFolder: GTD/Items` → `newItemFolder: GTD/Items`, and add `newItemTemplate: Templates/GTD Item.md` plus a `newItemProperties:` block setting `status: inbox`, so cards created on the board get the schema frontmatter.
       - Delete `cardOrders:` and any `columnColors:` block keyed by property (`columnColors: { note.status: {} }`). `Base Board`'s own `columnColors:` is a flat name→color map that it writes itself; don't hand-author it.
    2. **`GTD/Board.base` — strip the bloat.** Delete every `columnOrders:` block anywhere in the file, in particular any `file.file:` list of `GTD/Items/...` note paths. These are dead config from the old plugin and can be thousands of lines. Then check the `Inbox` and `Stale` views: if either has `type: kanban-view`, set it back to `type: table` (that drift is what generated the path lists) and delete any `columnOrders`/`cardOrders` under it. Leave their `filters:`, `order:` and `sort:` blocks alone — table views keep `file.name` in `order:`. Report the before/after line count of the file.
    3. **Item + archive notes** — nothing to change, but from now on a `kanban_order:` key may appear in any note's frontmatter. It is the plugin's, not ours: never add, reorder, normalize, or strip it, and don't bump `updated` because of it.
    4. **`.obsidian/snippets/gtd-kanban.css`** — now inert: it targets `.obk-card-property-label`, a class only the old plugin emitted, and the new board draws no property labels to hide. **Do not delete it and do not touch `.obsidian/`** — just tell the user it does nothing now and they can remove it and its `enabledCssSnippets` entry themselves if they want. v6 restores the rule that llm-gtd writes nothing outside `GTD/`, `Templates/GTD Item.md`, `clipper/` and `.claude/skills/`.
    5. **`CLAUDE.md`** — in the Layout block change the `GTD/Board.base` comment to say `Base Board plugin` and delete the `.obsidian/snippets/gtd-kanban.css` line, replacing it with a note that nothing is written outside those paths; after the item-schema YAML add a paragraph that `kanban_order` may appear, belongs to the plugin, and must be left exactly as found; restore rule 6 to forbid `.obsidian/` writes outright (no snippet exception, including during `/gtd-update`); and amend rule 7's "no extra keys" to except the plugin's `kanban_order`.
    6. **`README.md`** — if the vault has an `## LLM-GTD` section, replace any mention of `kanban-bases-view` or the `gtd-kanban` CSS snippet with `Base Board`, and note that card order within a column is stored per note in `kanban_order`.

    Manual steps to REPORT to the user (these live in Obsidian's plugin UI and can't be scripted — tell the user, don't attempt them):

    - **Install the new plugin:** Settings → Community plugins → Browse → search **Base Board** → Install, then enable it. Needs Obsidian **1.10.2 or newer** (Settings → About shows the version). Do this before the board is rewritten.
    - **Retire the old one:** once the board renders, `kanban-bases-view` can be disabled and uninstalled. Nothing in llm-gtd uses it after v6.
    - **Optional:** column colors and per-column WIP limits are on the board's own right-click menu; tag colors are on a tag chip's context menu. These are stored in `Board.base` by the plugin.

---

Before applying anything, confirm the vault's current version and the target, then show me the plan.

---

## Adding a future migration

When the schema changes again, append a new `### vN → vN+1` entry to the changelog **in two places, kept identical**: the `## The /gtd-update skill` block in this file, and section 8 of [`install.md`](install.md) (and its mirror in `install.html`). Bump the `Schema version:` number in the `install.md` / `install.html` schema so fresh installs start at the new latest. Existing vaults then pick the change up by running this prompt (or `/gtd-update` once their skill has been refreshed).
