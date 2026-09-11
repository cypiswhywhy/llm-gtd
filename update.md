# Updating an existing LLM-GTD vault

A self-contained prompt for bringing a vault that **already has LLM-GTD installed** up to the current schema. Paste it into Claude Code at the vault's root. It detects the vault's schema version, applies only the migrations it's missing, refreshes the in-vault `/gtd-update` skill, and does all of it non-destructively — propose-then-apply, logged, nothing outside `GTD/` touched.

- **Brand-new vault?** Use [`install.md`](install.md) instead — this prompt assumes an install is already present.
- **Day to day**, the installed `/gtd-update` skill does the same job from inside the vault. This file is the canonical, always-latest copy of the changelog. As of the current skill, `/gtd-update` points a `CANONICAL_SOURCE` at *this file* and checks it on every run, so once a vault has been through this prompt once it can detect newer versions on its own (and self-refresh) instead of going stale. Running this prompt also creates/repairs the skill for vaults installed before it existed.

No new plugins are needed to update — the six community plugins from `install.md` are already enabled. A migration may still *report* a manual step for things that live outside the vault (v3's Templater folder-template, v6's `Base Board` install, v7's clipper-template re-import); the prompt tells you, it never attempts them.

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
7. **Report** what changed and anything I should double-check. If the vault is already at the target, say "already up to date (vN)" — but still make sure the `/gtd-update` skill exists and matches the content below, and that `.claude/skills/gtd-project/SKILL.md` exists (both are printed below; create either if it's missing).

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
    3. **`.obsidian/snippets/gtd-kanban.css`** — **skip this step; it is retired.** v3 created a CSS snippet here to hide the old kanban plugin's property labels. v6 replaced that plugin with `Base Board`, which draws no labels, so the snippet is inert and llm-gtd writes nothing outside `GTD/` again. A vault migrating through v3 today must not create it.
    4. **`CLAUDE.md`** — note in the capture operation that new notes get frontmatter from the Templater folder-template (manual step below) and that triage backfills any item missing `created`/`source`. (v3 also put the snippet in the Layout and loosened the `.obsidian/` rule for it; both retire with step 3 — leave rule 6 alone.)

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

    ### v6 → v7 — newest items at the top of every column

    `Base Board` ignores the Bases `sort:` setting on a kanban view: it orders cards by the `kanban_order` property alone — dragged order first, then oldest-created — and its author has declined to make that configurable. v6 treated `kanban_order` as untouchable plugin state, which left every column stuck oldest-first with nothing the user could set to change it.

    v7 takes ownership of the *initial* value instead. An item is created carrying minus its creation timestamp in milliseconds, and since the plugin sorts that ascending, the newest item sits at the top of its column. Dragging still wins: the first drag inside a column converts that column to the plugin's own string keys, preserving what's on screen. Numbers sort before strings, so later captures still arrive above hand-arranged cards.

    1. **`Templates/GTD Item.md`** — add `kanban_order: <% -1 * Number(tp.date.now("x")) %>` as the last frontmatter line.
    2. **`clipper/gtd-clipper-template.json`** — add `{ "name": "kanban_order", "value": "{{date|date:\"x\"|calc:\"*-1\"}}", "type": "number" }` to `properties`. The type must be `number`. Tell the user this file has to be re-imported into the Web Clipper extension by hand — editing the copy in the vault changes nothing on its own.
    3. **`GTD/Board.base`** — in the kanban view (the one named `Board`), add `newCardsToTop: true` alongside `newItemProperties:`. Without it the `+` button — which writes its own `kanban_order` over whatever the template produced — drops new cards at the bottom. If that view has acquired a `sort:` block, delete it: it has never had any effect on a board and only misleads. Leave the table views' `sort:` blocks alone.
    4. **Item notes** — for every note in `GTD/Items/` with **no** `kanban_order` key, add one set to minus the note's file-creation time in milliseconds (a note created 2026-08-13 12:00 UTC → `kanban_order: -1786622400000`). Notes that already have a value — a number, or one of the plugin's string keys — are left exactly as found. Do **not** bump `updated` on any of them: this is board bookkeeping, not a content change. `GTD/Archive/` is not on the board, so skip it. Report how many notes were stamped and how many were left alone.
    5. **`.claude/skills/gtd-triage/SKILL.md`** — in the apply step, add `kanban_order` to the frontmatter backfill: if the key is absent set it to minus the note's file-creation time in milliseconds; never modify one that exists.
    6. **`CLAUDE.md`** — add `kanban_order` to the item-schema YAML block; replace the "not yours to manage" paragraph with the write-once rule (born as minus the creation timestamp in ms, sorts newest first, the plugin rewrites a whole column into string keys on the first drag, never re-stamp an existing value, never bump `updated` for it); and amend rule 7 so `kanban_order` reads as stamped-at-creation and otherwise preserved.
    7. **`README.md`** — if the vault has an `## LLM-GTD` section, note that board columns show newest first automatically, that the Bases "Sort" setting does nothing on the board, and that dragging a card overrides the automatic order for the cards present at that moment.

    Manual step to REPORT to the user (only if they use the web clipper — it lives in the browser extension and can't be scripted):

    - **Re-import the clipper template:** Web Clipper extension → Settings → Templates → import `clipper/gtd-clipper-template.json` again (or add the `kanban_order` property to the existing template by hand). Until then, clipped items keep arriving without a sort key and land at the bottom of the inbox column until the next `/gtd-triage` backfills them.

    ### v7 → v8 — projects: one outcome, one next step

    Outcomes that need many actions ("buy a flat", "renovate the kitchen", "plan the holiday", "quit smoking") had nowhere to live. Written as a single item they never started, because the card named a result instead of an action. Broken into cards by hand they buried the board — twenty obligations where there should be one. Both failures hit hardest for the people this system is for.

    v8 adds a home for the plan that is deliberately **not** the board: `GTD/Projects/`, one note per outcome, with the steps as a checklist and only the active step promoted to a real item. The new `/gtd-project` skill plans a project (`/gtd-project renovate the kitchen`) and, with no argument, sweeps every active project and promotes the next step of any that has room.

    Nothing existing changes. No item frontmatter is rewritten, no `updated` date on an item moves, `GTD/Board.base` is untouched (projects live outside `GTD/Items/`, so the board's filter already excludes them), the Templater template and the clipper template are untouched — so there is **no clipper re-import and no manual step** in this migration.

    1. **`GTD/Projects/`** — create the folder.
    2. **`.claude/skills/gtd-project/SKILL.md`** — create it with the `gtd-project` skill, **verbatim**. Its full text is not repeated here: it is section 9 of `install.md`, and the `## The /gtd-project skill` section of the canonical `update.md` — the file `CANONICAL_SOURCE` points at, which the self-check has already read by this point. Take it from there. If the canonical source could not be read on this run, apply nothing for v8 and say so: a whole new skill file cannot be reconstructed from a changelog entry, and half a v8 is worse than none. If the path already exists, STOP and report the collision instead of overwriting.
    3. **`GTD/Log.md`** — add `[project]` to the `Ops:` line in the header.
    4. **`CLAUDE.md`** — add `GTD/Projects/     # one note per project — the plan for a multi-step outcome, never on the board` to the Layout block; add an optional `project:` key to the item-schema YAML with a note that it appears only on a project step and that neither the template nor the clipper writes it; add a `## Projects` section holding the project-note frontmatter (`status: active|someday|waiting|done` — projects have their own vocabulary because they are never on the board — plus `wip: 1`, `outcome:`, and no `kanban_order`), the `## Outcome` / `## Steps` / `## Notes` body shape with an example checklist, the physical-action-plus-estimate rule for step text, the three anti-drift rules (the checklist is the plan and only a promoted step becomes an item; a checklist line is never deleted; wikilinks are name-only so archiving an item doesn't break them), and the note that a done project stays in `GTD/Projects/` and is never archived; add a **project** bullet to Operations; widen rule 1 to cover project notes; and amend rule 7 so `project`, `wip` and `outcome` read as part of the schema rather than stray keys.
    5. **`README.md`** — if the vault has an `## LLM-GTD` section, add a line for `/gtd-project`: projects live in `GTD/Projects/` and never appear as cards, only the active step does, and running `/gtd-project` with no argument advances every project that has room.
    6. **No item notes are touched.** Only the `Schema version:` marker, the two new files, and the two docs change.

    ### v8 → v9 — a project that stalls gets surfaced, not forgotten

    v8 gave every project exactly one visible step. The failure mode that creates is silent: the step goes cold, the card stays quiet, nothing is overdue, and the project simply stops existing. No signal fires, because the system is working as designed. That silence is precisely what this system exists to prevent, so v9 teaches `/gtd-review` to look for it.

    Movement is **derived, never stored** — no new frontmatter key, no backfill, nothing that can drift. A project last moved on the latest of three dates already on disk: the most recent `✅ YYYY-MM-DD` in its `## Steps` checklist, the `updated` of its live step item(s), and its own `created`.

    1. **`.claude/skills/gtd-review/SKILL.md`** — add a **Stalled projects** check as the new check **1** and renumber the existing eight to 2–9. The check: for each `GTD/Projects/` note with `status: active`, derive the last-moved date as above; stalled at **14 days** of no movement, or **30 days** for a project already at `status: waiting` (blocked is not a permanent state); `someday` projects are skipped. Stalled projects are reported **first**, one line each — project, days since it moved, the step it is stuck on — with the single question *what is blocking it?* and **exactly one** proposed exit out of four: needs a sweep (`/gtd-project` promotes the next step; the review never promotes), the step is too big (offer to split it into two checklist lines), blocked on another party (`status: waiting` with who and since when), or over 60 days with no exit fitting (ask outright: `someday`, or `done` with a `Cancelled:` line). Proposing all four per project is what turns a review into another pile of decisions, so propose one and say why. A step item of a *stalled* project is reported under its project and not again in checks 3–5; when the project is moving and only one step is cold, that item is reported by its own check and the project is left alone. Also: widen the skill's opening line and its `Read all notes` instruction to cover `GTD/Projects/` alongside `GTD/Items/`, add stalled projects to the `description:`, and add active/stalled project counts to the health line at the top of the report (Output step 1).
    2. **`CLAUDE.md`** — extend the **review** operation bullet so it mentions spotting stalled projects alongside stale items.
    3. **No item and no project notes are touched.** Only the `Schema version:` marker and those two files change — and nothing is written outside `GTD/`, `Templates/GTD Item.md`, `clipper/` and `.claude/skills/`.

    ### v9 → v10 — migrations stop paraphrasing the skills they edit

    A migration that *edits* a skill used to describe the edit in prose — "add a check that derives the last-moved date" — and the agent applying it wrote that check in its own words. The result was correct but not the canonical text, and the damage compounds: v10's instructions land on v9's paraphrase and get paraphrased again, from a base that already drifted. After a few rounds the skill in a vault and the skill in the repo are two different documents, and nothing can tell a harmless rewording from a rule that quietly went missing.

    v8 already solved this for a *new* skill: `/gtd-project` couldn't be described, so the canonical source prints it in full and the migration copies it verbatim. v10 extends that to edits. From here on the canonical `update.md` prints the current text of **every** skill, and a migration that changes one says "overwrite it verbatim from that section" instead of describing the change. v4 set the precedent for a whole-file overwrite; this makes it the rule.

    Like v4, this migration touches no vault data. Its only job is to replace two skill files with their canonical text, which heals whatever paraphrasing earlier migrations left behind.

    1. **`.claude/skills/gtd-triage/SKILL.md`** — overwrite it, verbatim, with the `## The /gtd-triage skill` section of the canonical `update.md` (the file `CANONICAL_SOURCE` points at, already read by the self-check). Report the line count before and after.
    2. **`.claude/skills/gtd-review/SKILL.md`** — the same, from the `## The /gtd-review skill` section.
    3. **Before overwriting either, check for content that is *not* in the canonical text** — a note someone added to their own copy. If you find any, show it and ask before dropping it; otherwise replace the file without asking. Whitespace and wording differences are exactly what this migration exists to remove, so don't ask about those.
    4. **If the canonical source could not be read on this run, apply nothing for v10** and say so. There is no way to reconstruct a canonical text from a changelog entry, which is the whole point of the change.
    5. **Nothing else.** No item notes, no project notes, no frontmatter, no board, no template, no clipper, no `CLAUDE.md` schema edits, and no `updated` date moves anywhere. Only the `Schema version:` marker and those two files change.

---

## The `/gtd-project` skill — the file the v8 migration installs

v8 adds a second skill to the vault. A changelog entry can only describe *edits*, so a brand-new file has to be printed in full somewhere — that's this section. When v8 is one of the migrations being applied, write the following verbatim to `.claude/skills/gtd-project/SKILL.md`. If that path already exists, STOP and report the collision instead of overwriting it.

    ---
    name: gtd-project
    description: Plan a multi-step project and keep only its next action on the board. Use when the user names an outcome too big for one item (a renovation, a house purchase, a holiday, learning a skill, quitting a habit), asks to break a project down, or asks what the next step of a project is. With no argument it sweeps every active project and promotes the next step of any that has room.
    ---

    # GTD projects — one outcome, one next step

    A project is an outcome that needs more than one action. Its plan lives as a checklist in a
    `GTD/Projects/` note; only the active step exists as an item in `GTD/Items/`. Follow the schema and
    the rules in the vault's `CLAUDE.md` — in particular the `## Projects` section and the
    propose-then-apply rule.

    Why it works this way: a twenty-step plan rendered as twenty cards is unusable. It reads as twenty
    separate obligations, the board stops being a place where anything gets decided, and the project
    stalls precisely because all of it is visible at once. **One visible step per project is the whole
    feature** — never promote more steps than the project's `wip`, however reasonable it seems.

    ## Mode A — plan a project (`/gtd-project <description>`)

    First look in `GTD/Projects/` for a note that matches the description. If one is there, this is a
    **re-plan**: load it, skip to step 3, and add or rewrite **unchecked steps only** — never edit a
    `- [x]` line.

    1. **Agree the outcome.** Ask for one sentence saying how the user will know the project is
       finished. Push back on outcomes nobody can observe: "get fit" → "run 5 km without stopping".
       That sentence becomes `outcome:` and the `## Outcome` body section.

    2. **Ask only what you can't work out yourself.** At most three questions, and only ones that
       change the plan — a deadline, a budget, a constraint that deletes whole steps. Don't interview.

    3. **Draft the steps** — 5 to 12, in order, each one:
       - a **physical action** beginning with a verb, startable without deciding anything first.
         "Research studios" is not a step; "open Instagram, search #tattoowarsaw, paste 3 profiles into
         the project note" is.
       - **one sitting**, with a rough estimate appended as `~10m`, `~45m`, `~2h`. Anything over about
         two hours is really two steps — split it.
       - a **decision** where a decision is what's needed ("pick a studio and pay the deposit ~30m").
         An unmade choice blocks a project exactly as well as an undone task.
       If the project has an external date (a holiday, a deadline), order the steps backwards from it
       and say which step has to start when.

    4. **Propose.** Show the outcome, the numbered steps with estimates, and the total. Ask the user to
       confirm, cut, or reorder. Wait — write nothing yet.

    5. **Apply on confirmation:**
       - Create `GTD/Projects/<Project name>.md` with the project frontmatter from `CLAUDE.md`
         (`status: active`, `wip: 1`, today's `created`/`updated`, the `outcome`, and tags reused from
         the vault's existing vocabulary) and the `## Outcome` / `## Steps` / `## Notes` body. Create
         `GTD/Projects/` if it doesn't exist. If the note already exists and this was not a re-plan,
         STOP and report the collision — never overwrite.
       - Promote the **first step only** (see Promotion below).
       - Append to `GTD/Log.md`: `YYYY-MM-DD HH:MM [project] "<Project>" created (N steps) → "<first step>"`.

    6. **Report** in three lines: the outcome, the first step, and how long that step takes. Nothing
       else — the plan is in the note, and the user only has to do one thing.

    ## Mode B — sweep (`/gtd-project` with no argument)

    1. **Collect** every note in `GTD/Projects/` with `status: active`.
    2. **Count each project's live steps**: items in `GTD/Items/` whose `project` points at that project
       and whose `status` is not `done`.
    3. **Per project, work out what's needed:**
       - A promoted step's item is now `status: done` → tick its checklist line first: `- [x]` plus
         `✅ ` and the item's `updated` date.
       - Live steps below `wip`, unchecked steps remaining → propose promoting the first unchecked one.
       - Live steps at `wip` → nothing to propose; just name the step already on the board.
       - No unchecked steps left → propose closing the project (`status: done`). If its `## Notes` hold
         research worth keeping, offer the distillation from `/gtd-review`'s knowledge check.
       - The live step's item untouched for more than 14 days → say so and ask whether the step is too
         big. Offer to split it into two smaller checklist lines and promote the first.
    4. **Propose one table** covering all projects: project, step just completed, proposed next step,
       estimate. Ask the user to confirm all / pick exceptions.
    5. **Apply** confirmed promotions, ticks and closures. Bump `updated` on every project note whose
       content changed. Append one `[project]` line per project to `GTD/Log.md`.
    6. **Report.** Lead with the promoted steps as a short list the user can act on today. Then one line
       each for any `waiting` projects (blocked, and on whom) and any `someday` projects, so a stalled
       project can't hide — but propose nothing for those.

    ## Promotion — the one operation both modes share

    1. Create the item note in `GTD/Items/`, named after the step text with the `~estimate` stripped,
       carrying the item frontmatter from `CLAUDE.md`: `status: next`, today's `created`/`updated`,
       `tags` inherited from the project, empty `source:`, `project: "[[<Project name>]]"`, and
       `kanban_order` set to minus the current time in milliseconds.
    2. `status: next`, not `focus`: `focus` is the human's own shelf for what they are doing today, and
       a promotion has no business filling it. The user drags the card over when they pick it up.
    3. Body: the step text in full, its estimate, and a `Part of [[<Project name>]]` line. Copy across
       whatever detail from the project's `## Notes` the step needs — the point is that the card can be
       acted on without opening the project note.
       If the step produces something — a list, a number, a decision — name the section of the project
       note where that output lands: working material goes under `## Notes`. Never send it to
       `## Outcome`, which holds nothing but the definition of done.
    4. Append `→ [[<Item name>]]` to that step's checklist line in the project note. Link by **note
       name, never by path**: review moves done items into `GTD/Archive/` and a name-only wikilink
       survives the move.
    5. If an item of that name already exists in `GTD/Items/` or `GTD/Archive/`, don't collide
       silently — propose a distinguishing name (append the project, e.g. `Call 3 studios (Tattoo)`).
    6. Never promote a step already marked `- [x]`, and never take a project above its `wip`.

    ## Guard clauses

    - **Never delete** a project note or a checklist line. An abandoned project is `status: done` with a
      `Cancelled: <reason>` line in the body; an abandoned step is `- [x] ~~text~~ (cancelled: reason)`.
    - A done project **stays in `GTD/Projects/`** — it records how the thing got done. Projects are
      never archived; `GTD/Archive/` is for items.
    - Never write a `kanban_order` into a project note: projects are not on the board.
    - Never touch `GTD/Board.base`, `.obsidian/`, or any note outside `GTD/`.

---

## The `/gtd-triage` skill — the canonical text

The canonical text of every skill lives in this file, which is what lets a migration say "overwrite it verbatim" instead of describing an edit (see v10). When a migration tells you to replace this skill, write the following to `.claude/skills/gtd-triage/SKILL.md` exactly as printed.

    ---
    name: gtd-triage
    description: Process the GTD inbox — enrich, tag, and route items to kanban columns. Use when the user wants to clear or triage their inbox, or asks "what's in my inbox".
    ---

    # GTD inbox triage

    Process every item with `status: inbox` in `GTD/Items/`. Follow the schema and rules in the vault's `CLAUDE.md`.

    ## Steps

    1. **Collect.** Read frontmatter of all notes in `GTD/Items/`; select those with `status: inbox`, oldest `created` first. Some hand-made notes may lack `created` or `source` — for ordering, treat a missing `created` as the note's file-creation date. If none: say the inbox is empty and stop.

    2. **Build the tag vocabulary.** Gather all `tags` used across `GTD/Items/` and `GTD/Archive/` so suggestions reuse existing tags.

    3. **Enrich each item:**
       - If `source` has a URL and the body is empty or just a raw clip: fetch the URL and write a 2–4 sentence summary into the body (keep any existing user text above it, add summary under a `## Summary` heading). If the fetch fails, note that and move on — never block the batch.
       - Suggest tags from the vocabulary (new tag only if nothing fits).
       - Propose a destination status using GTD clarification rules:
         - actionable and quick (~2 min) → suggest the user just does it now; otherwise `next`
         - actionable but the user is actively on it → `focus` (warn if Focus would exceed 5 items)
         - blocked on someone/something else → `waiting`
         - "maybe someday", no commitment → `someday`
         - pure reference with no action (e.g. an interesting read already skimmed) → propose `done` after distilling the useful part into the body, or keeping it as `someday` reading
       - If the title isn't action-oriented, propose a rename (short verb phrase).

    4. **Propose the batch.** Present one table: item, proposed status, proposed tags, rename (if any), one-line rationale. Ask the user to confirm all / pick exceptions.

    5. **Apply confirmed changes only:** update frontmatter (`status`, `tags`), rename files via `mv` when approved, bump `updated` to today, keep `created` untouched. Also backfill schema gaps on every processed item: if `created` is missing, set it to the note's file-creation date (fall back to today); if the `source` key is absent, add an empty `source:`; if `kanban_order` is absent, set it to minus the note's file-creation time in milliseconds (an item with no sort key sinks to the bottom of its column). Never change a `kanban_order` that is already there, whatever its value. This heals hand-made notes that bypassed the template.

    6. **Log.** Append one line per processed item to `GTD/Log.md`: `YYYY-MM-DD HH:MM [triage] "<title>" → <status> (tags: ...)`.

    7. **Report.** Summarize what moved where, and mention anything the user should decide later.

---

## The `/gtd-review` skill — the canonical text

Likewise for `.claude/skills/gtd-review/SKILL.md`.

    ---
    name: gtd-review
    description: GTD weekly review / lint pass — surface stalled projects, flag stale items, archive old done items, resurface someday items, spot duplicates. Use when the user asks for a review, weekly review, cleanup, or "what's rotting".
    ---

    # GTD review (lint pass)

    A maintenance sweep over `GTD/Items/` and `GTD/Projects/`, in the spirit of llm-wiki's lint operation. Follow the schema and rules in the vault's `CLAUDE.md`. Report first; apply only what the user confirms.

    ## Checks

    Read all notes in `GTD/Items/` and every project note in `GTD/Projects/`, then evaluate (item thresholds by `updated`, project thresholds by the derived last-moved date in check 1, both relative to today):

    1. **Stalled projects** — read every note in `GTD/Projects/` with `status: active` and work out when it last *moved*: the latest of the most recent `✅ YYYY-MM-DD` in its `## Steps` checklist, the `updated` of its live step item(s), and the project's own `created` (for one that has never moved at all). Nothing in **14 days** → stalled. A project already at `status: waiting` counts as stalled after **30 days** instead — being blocked on someone else is not a permanent condition. `someday` projects are skipped by definition.

       Stalled projects go **first** in the report, one line each: the project, how many days since it moved, and the step it is stuck on. Then ask the one question that matters — *what is blocking it?* — and propose **exactly one** exit, the one the evidence supports, with a word on why:
       - the live step's item is `done` and unchecked steps remain → the project only needs a sweep; say so and point at `/gtd-project`. Don't promote from here; promotion is that skill's job.
       - the live step has sat untouched since the day it was promoted → it is probably too big to start. Offer to split it into two smaller checklist lines.
       - the step text or the project body names another party → `status: waiting` on the project, with who and since when in the body.
       - over 60 days and no exit fits → ask outright whether it is still wanted: `status: someday`, or `status: done` with a `Cancelled: <reason>` line.

       Four exits, one proposal. Offering all four per project turns the review into another pile of decisions instead of the thing that clears them.

       A step item belonging to a **stalled** project is reported here, under its project, and not a second time in checks 3–5. When the project is moving and only one of its steps is cold, the reverse holds: that item is reported by its own check and the project is left alone.

    2. **Inbox backlog** — items still `inbox` after 3 days → recommend running `/gtd-triage`.
    3. **Stale focus** — `focus` untouched > 7 days → ask: still working on it? Suggest `next`, `waiting`, or `someday`.
    4. **Stalled waiting** — `waiting` untouched > 14 days → suggest a follow-up action (ping the other party) or unblocking.
    5. **Old next** — `next` untouched > 30 days → honesty check: promote to `focus` or demote to `someday`.
    6. **Someday resurface** — pick up to 5 `someday` items (oldest `updated` first) and ask whether any should become `next` or be closed.
    7. **Archive** — `status: done` with `updated` older than 30 days → move the file to `GTD/Archive/` (plain `mv`, keep the name).
    8. **Hygiene** — items with no tags, near-duplicate titles, frontmatter that deviates from the schema in `CLAUDE.md`.
    9. **Knowledge distillation** — for done items whose body holds lasting research (e.g. product comparisons, findings), offer to extract the essence into a permanent note outside `GTD/` (e.g. a `Wiki/` note) and link it from the item before it gets archived.

    ## Output

    1. Present a **review report** grouped by check, with a proposed action per finding (skip empty checks). Focus/next/waiting counts plus active/stalled project counts at the top give the board's health at a glance.
    2. Ask the user to confirm all / pick exceptions.
    3. Apply confirmed changes: frontmatter edits, `mv` to Archive, bump `updated` on every touched note.
    4. Append to `GTD/Log.md`: one `[review]` summary line plus one `[archive]` line per archived item.
    5. Close with the 1–3 things that most need the user's attention this week.

---

Before applying anything, confirm the vault's current version and the target, then show me the plan.

---

## Adding a future migration

When the schema changes again, append a new `### vN → vN+1` entry to the changelog **in two places, kept identical**: the `## The /gtd-update skill` block in this file, and section 8 of [`install.md`](install.md) (and its mirror in `install.html`). Bump the `Schema version:` number in the `install.md` / `install.html` schema so fresh installs start at the new latest. Existing vaults then pick the change up by running this prompt (or `/gtd-update` once their skill has been refreshed).

A migration that touches a **skill file at all** needs one thing more. The changelog describes edits, so a new file has to be printed in full: give it its own `## The /<name> skill` section inside this prompt *and* its own numbered section in `install.md`, and have the changelog entry point at both rather than repeating the text a third time. v8 and `/gtd-project` are the worked example — and note the consequence the entry spells out: that migration can only be applied when the canonical source was actually read, so it refuses to apply itself offline instead of writing half of v8.

Since v10 the same holds for **editing** a skill, not just adding one. Never describe the edit in prose — the agent applying it would write its own wording, and the next migration would then edit *that*. Instead update the skill's own section in this file and in `install.md`, and let the entry say: overwrite `.claude/skills/<name>/SKILL.md` verbatim from that section. Every skill is printed here for exactly that reason; keep it that way when you add the next one.
