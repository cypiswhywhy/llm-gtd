# Installing LLM-GTD elsewhere

A self-contained prompt for setting this system up in an Obsidian vault — paste it into Claude Code after the one manual step below. It embeds the full schema, so Claude Code can write every file from scratch without needing access to this repo.

Works on a **fresh vault** or an **existing one**: everything the system creates is namespaced under `GTD/` (plus `Templates/GTD Item.md`, `clipper/` and the Claude skills), and the prompt below carries guard clauses so it merges into — rather than overwrites — a vault that already has content. It writes nothing at all outside those paths — no `.obsidian/` config, no CSS snippet — so your existing notes and your Obsidian setup are never touched.

## One-time manual steps

These happen in Obsidian's own UI — no prompt can do them.

1. **Install the plugins.** Settings → Community plugins → enable, then install these six: `Dataview`, `Templater`, `Obsidian Kanban`, `Base Board`, `Obsidian Tasks Plugin`, `Icon Folder`. Enable all six. (`Base Board` renders the kanban board on top of Obsidian's Bases feature and needs Obsidian **1.10.2 or newer**.)

2. **Auto-fill frontmatter on new notes** — so items you create by hand in the inbox get `created`/`source` without thinking. Settings → Templater → turn on **Trigger Templater on new file creation**, then under **Folder Templates** add a mapping: folder `GTD/Items` → template `Templates/GTD Item.md`. Now any note you create in `GTD/Items/` is stamped with the schema frontmatter automatically. (Web-clipped notes already carry it; this covers the hand-made ones. Triage also backfills anything that still slips through.)

Nothing else is needed to make the cards look right: `Base Board` draws the note name as the card title and renders each item's tags as its own colored pills, so a card reads `tag1 tag2` with no property-name labels and no CSS snippet involved.

Card order inside a column is the plugin's own `kanban_order` property, **not** the Bases "Sort" setting — `Base Board` ignores that on a kanban view by design, so setting it there does nothing. Instead every new item is stamped with minus its creation timestamp, which sorts newest to the top of its column automatically, whether it arrived from the clipper, the template or the board's `+` button. Dragging still works and takes precedence.

## The prompt

Open a terminal at the vault's root and run Claude Code, then paste this in:

---

Set up a GTD (Getting Things Done) system in this Obsidian vault, following the "llm-wiki" idea (https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f): I capture and decide, you do the bookkeeping. Create the following files exactly as specified — don't improvise on the schema.

## Before you touch anything — existing-vault safety

This vault may already contain notes. **Never overwrite or delete existing content.** First check what's already there and adapt:

- **`CLAUDE.md` at the root** — if it already exists, do NOT replace it. Append the schema below under a new `# LLM-GTD — vault schema` heading (or a clearly separated section), preserving everything already in the file.
- **`README.md` at the root** — if it already exists, do NOT replace it. Append the GTD usage notes (step 8) under a new `## LLM-GTD` heading instead.
- **`GTD/`, `Templates/GTD Item.md`, `clipper/gtd-clipper-template.json`, `.claude/skills/gtd-triage/`, `.claude/skills/gtd-review/`** — if any of these already exist, STOP and report the collision instead of overwriting. Ask me how to proceed (rename, merge, or skip). Only create the ones that are absent.
- **`Templates/`** — this folder may already exist and hold other templates; add `GTD Item.md` alongside them, don't disturb the rest.
- Everything the system creates lives under `GTD/` (plus the two skills and `clipper/`). Do not read, move, retag, or modify any pre-existing note outside `GTD/` at any point.

Report which of the files below already existed and how you handled each before writing anything.

## 1. `CLAUDE.md` at the vault root (append if the file already exists — see safety note above)

    # LLM-GTD — vault schema

    This vault is an Obsidian-based GTD (Getting Things Done) system maintained jointly by the human and Claude, following the llm-wiki idea: the human captures and decides, the LLM does the bookkeeping. This file is the schema — read it before touching anything.

    **Schema version: 7.** Version marker for migrations — the `/gtd-update` skill and the repo's `update.md` read the integer here to know which schema changes a vault still needs. Migrations bump it; don't edit it by hand.

    ## Layout

    ```
    GTD/Board.base    # kanban board (Bases + Base Board plugin) + Inbox/Stale/All views
    GTD/Items/        # one markdown note per GTD item — the ONLY place items live
    GTD/Archive/      # old done items, moved here by review
    GTD/Attachments/  # files an import brought with it — created on demand
    GTD/Log.md        # append-only activity log
    Templates/GTD Item.md   # Templater template for new items
    clipper/          # Obsidian Web Clipper template
    ```

    Nothing is written outside those paths — in particular `.obsidian/` is never touched.

    ## Item schema

    Every note in `GTD/Items/` and `GTD/Archive/` has this frontmatter — it is the single source of truth (the board just renders it):

    ```yaml
    ---
    status: inbox   # inbox | focus | next | someday | waiting | done
    tags: []        # lowercase, kebab-case; REUSE existing tags before inventing new ones
    created: YYYY-MM-DD
    updated: YYYY-MM-DD   # bump on EVERY meaningful change
    source:         # URL for web clips; empty otherwise
    kanban_order: -1786636800000   # board sort key — stamped at creation, then hands off to the plugin
    ---
    ```

    `kanban_order` is the board's sort key and it is **write-once, at creation**. A new item is born
    with minus its creation timestamp in milliseconds (`-1786636800000`). `Base Board` sorts a column
    by this value ascending, so a more negative number means a newer item and every column shows
    **newest at the top** with no dragging involved. All three capture paths stamp it: the Templater
    template, the web-clipper template, and the board's own `+` button (which supplies its own value).

    After creation it belongs to the plugin. Dragging a card inside a column makes `Base Board`
    rewrite the numbers in **that whole column** as its own short string keys (`a0`, `a1`, …),
    preserving the order on screen — that is expected, not corruption. Numbers sort before strings,
    so freshly captured items still arrive above hand-arranged ones.

    So: stamp it on items *you* create, and otherwise leave every existing value **exactly as
    found** — never re-stamp, reorder, normalize, or strip one, and never bump `updated` because of
    it. It carries no GTD meaning and it is not a completion signal.

    `status` is the single source of truth and the ONLY completion signal — an item is done when `status: done`, nothing else. There is deliberately no separate `done` boolean: the kanban plugin has no per-card checkbox that moves a card between columns, so a second field would just drift out of sync with `status`.

    Status vocabulary (kanban columns, in order):

    | status | meaning |
    |---|---|
    | `inbox` | unprocessed capture — thoughts, clips, notes |
    | `focus` | being worked on right now (keep ≤ 3–5 items) |
    | `next` | queued for when Focus frees up |
    | `someday` | worth keeping, no timeline |
    | `waiting` | blocked on another party |
    | `done` | finished or cancelled |

    Note title = file name, short and action-oriented ("Buy trail running shoes", not "shoes"). Body holds content: clip summaries, links, checklists, research.

    To complete an item on the board, **drag its card to the `done` column** — that sets `status: done`. (Dragging between any two columns is how the board rewrites `status`.)

    ## Operations

    - **capture** — create a note in `GTD/Items/` from the template with `status: inbox`. Do NOT process at capture time; capture must stay frictionless. New notes get their frontmatter from the Templater folder-template (a one-time Obsidian setting — see the README); any hand-made note that's missing `created` or `source` is backfilled at triage.
    - **triage** (`/gtd-triage`) — process the inbox: enrich (summarize `source` URLs into the body), tag, propose a destination status per item. llm-wiki's *ingest*.
    - **review** (`/gtd-review`) — the lint pass: flag stale items, archive old done items, surface someday items, spot duplicates. llm-wiki's *lint*.
    - **import** — bulk-load an existing system (a Notion export, a CSV) into `GTD/Items/` by pasting the repo's `import-notion.md` prompt: it surveys the export, proposes a status/tag/field map, then writes. A capture operation — the thinking happens afterwards at triage.
    - **query** — answer questions from item notes ("what am I waiting for?", "what did I research about shoes?"). Read-only.

    ## Rules for the agent

    1. **Never delete** an item note. Cancelled → `status: done` with a `Cancelled: <reason>` line in the body. Old done items → move to `GTD/Archive/`.
    2. **Propose, then apply.** Triage and review present a batch proposal and wait for the human's confirmation before writing (the human decides; you file).
    3. **Bump `updated`** (YYYY-MM-DD) on every note you modify.
    4. **Log every operation** in `GTD/Log.md`: append-only, newest at the bottom, format `YYYY-MM-DD HH:MM [op] message`. Never rewrite existing lines.
    5. **Keep the tag vocabulary tight.** Before tagging, list tags already used across `GTD/Items/` and `GTD/Archive/` and reuse them; introduce a new tag only when nothing fits.
    6. **Don't touch** `.obsidian/` config or `GTD/Board.base`, ever — not during item operations, and not during `/gtd-update`. Everything this system writes lives under `GTD/`, `Templates/GTD Item.md`, `clipper/`, and `.claude/skills/`.
    7. Frontmatter must always match the schema above — no renamed keys, and no extra keys of your own. `kanban_order` is the one key with split ownership: stamp it on an item you create (minus the creation timestamp in milliseconds), and preserve any value you find untouched.

## 2. `Templates/GTD Item.md` (Templater template — the folder-template step in the manual setup applies this to every new note in `GTD/Items/`)

    ---
    status: inbox
    tags: []
    created: <% tp.date.now("YYYY-MM-DD") %>
    updated: <% tp.date.now("YYYY-MM-DD") %>
    source:
    kanban_order: <% -1 * Number(tp.date.now("x")) %>
    ---

`tp.date.now("x")` is the creation time in milliseconds; negating it is what puts the newest item at
the top of its board column (see the `kanban_order` note in section 1). Keep the `-1 *` — a positive
timestamp sorts newest to the *bottom*.

## 3. `GTD/Board.base` (Bases file — needs the `Base Board` plugin)

    filters:
      and:
        - file.inFolder("GTD/Items")
    properties:
      note.status:
        displayName: Status
      note.tags:
        displayName: Tags
      note.created:
        displayName: Created
      note.updated:
        displayName: Updated
      note.source:
        displayName: Source
    views:
      - type: kanban
        name: Board
        groupBy:
          property: status
          direction: ASC
        order:
          - file.name
        newItemFolder: GTD/Items
        newItemTemplate: Templates/GTD Item.md
        newItemProperties:
          status: inbox
        newCardsToTop: true
        boardColumns:
          - inbox
          - focus
          - next
          - someday
          - waiting
          - done
      - type: table
        name: Inbox
        filters:
          and:
            - status == "inbox"
        order:
          - file.name
          - tags
          - created
          - source
        sort:
          - property: created
            direction: ASC
      - type: table
        name: Stale
        filters:
          or:
            - and:
                - status == "inbox"
                - updated < now() - "3 days"
            - and:
                - status == "focus"
                - updated < now() - "7 days"
            - and:
                - status == "waiting"
                - updated < now() - "14 days"
            - and:
                - status == "next"
                - updated < now() - "30 days"
        order:
          - file.name
          - status
          - tags
          - updated
        sort:
          - property: updated
            direction: ASC
      - type: table
        name: All items
        order:
          - file.name
          - status
          - tags
          - created
          - updated
        sort:
          - property: updated
            direction: DESC

Three things about the **kanban view** are deliberate and easy to break:

- `order:` lists **`file.name` and nothing else**. `Base Board` draws the card title from the filename and renders each item's tags as its own colored pills, both independently of `order:` — so adding `tags` here would print every tag twice, once as a pill and once as a `Tags: …` chip. `file.name` itself is never drawn as a chip (the plugin skips it) but must stay listed: the plugin re-inserts it on every render to keep card titles searchable, and rewrites `Board.base` if it's missing.
- `groupBy.property` is the **bare** `status`, not `note.status`.
- `boardColumns` is a **flat list** of the status values, not a map keyed by property.

The **table** views keep `file.name` in `order:` because a table needs it as a column.

A fourth thing about the kanban view is deliberate: **`newCardsToTop: true`**. The `+` button on a column writes its own `kanban_order` over whatever the template produced, and this option is what makes the value it picks land the card at the top instead of the bottom — it is how the `+` button agrees with the newest-first ordering the template and clipper produce. There is deliberately **no `sort:` block on the kanban view**: `Base Board` ignores Bases sorting on a board and orders cards by `kanban_order` alone, so a `sort:` here would look meaningful and do nothing. The *table* views do honour `sort:`.

Card order within a column therefore comes from each note's `kanban_order` (newest first by default, dragging overrides), never from `Board.base` — so it can't accumulate there. Column colors and per-column WIP limits are set from the board's own context menu and land in `columnColors:` / `wipLimits:` — leave them out of the file you write and let the plugin add them.

## 4. `GTD/Log.md`

    # GTD Log

    Append-only activity log. Newest entries at the bottom. One line per action, format:

    `YYYY-MM-DD HH:MM [op] message`

    Ops: `[capture]` `[triage]` `[review]` `[archive]` `[import]` `[migrate]`

    ---

## 5. `clipper/gtd-clipper-template.json` (import into the Obsidian Web Clipper browser extension)

    {
      "schemaVersion": "0.1.0",
      "name": "GTD Inbox",
      "behavior": "create",
      "noteNameFormat": "{{title}}",
      "path": "GTD/Items",
      "context": "",
      "noteContentFormat": "{{content}}",
      "properties": [
        { "name": "status", "value": "inbox", "type": "text" },
        { "name": "tags", "value": "", "type": "multitext" },
        { "name": "created", "value": "{{date|date:\"YYYY-MM-DD\"}}", "type": "date" },
        { "name": "updated", "value": "{{date|date:\"YYYY-MM-DD\"}}", "type": "date" },
        { "name": "source", "value": "{{url}}", "type": "text" },
        { "name": "kanban_order", "value": "{{date|date:\"x\"|calc:\"*-1\"}}", "type": "number" }
      ],
      "triggers": []
    }

`{{date|date:"x"|calc:"*-1"}}` is the clip's timestamp in milliseconds, negated by the clipper's
`calc` filter — the same board sort key the Templater template produces, so a clipped item lands at
the top of the inbox column. The property type must be `number`; as text it would sort as a string
and fall below every real number.

## 6. `.claude/skills/gtd-triage/SKILL.md`

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

## 7. `.claude/skills/gtd-review/SKILL.md`

    ---
    name: gtd-review
    description: GTD weekly review / lint pass — flag stale items, archive old done items, resurface someday items, spot duplicates. Use when the user asks for a review, weekly review, cleanup, or "what's rotting".
    ---

    # GTD review (lint pass)

    A maintenance sweep over `GTD/Items/`, in the spirit of llm-wiki's lint operation. Follow the schema and rules in the vault's `CLAUDE.md`. Report first; apply only what the user confirms.

    ## Checks

    Read all notes in `GTD/Items/` and evaluate (thresholds by `updated`, relative to today):

    1. **Inbox backlog** — items still `inbox` after 3 days → recommend running `/gtd-triage`.
    2. **Stale focus** — `focus` untouched > 7 days → ask: still working on it? Suggest `next`, `waiting`, or `someday`.
    3. **Stalled waiting** — `waiting` untouched > 14 days → suggest a follow-up action (ping the other party) or unblocking.
    4. **Old next** — `next` untouched > 30 days → honesty check: promote to `focus` or demote to `someday`.
    5. **Someday resurface** — pick up to 5 `someday` items (oldest `updated` first) and ask whether any should become `next` or be closed.
    6. **Archive** — `status: done` with `updated` older than 30 days → move the file to `GTD/Archive/` (plain `mv`, keep the name).
    7. **Hygiene** — items with no tags, near-duplicate titles, frontmatter that deviates from the schema in `CLAUDE.md`.
    8. **Knowledge distillation** — for done items whose body holds lasting research (e.g. product comparisons, findings), offer to extract the essence into a permanent note outside `GTD/` (e.g. a `Wiki/` note) and link it from the item before it gets archived.

    ## Output

    1. Present a **review report** grouped by check, with a proposed action per finding (skip empty checks). Focus/next/waiting counts at the top give the board's health at a glance.
    2. Ask the user to confirm all / pick exceptions.
    3. Apply confirmed changes: frontmatter edits, `mv` to Archive, bump `updated` on every touched note.
    4. Append to `GTD/Log.md`: one `[review]` summary line plus one `[archive]` line per archived item.
    5. Close with the 1–3 things that most need the user's attention this week.

## 8. `.claude/skills/gtd-update/SKILL.md`

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

## 9. Also create

- Empty folders `GTD/Items/` and `GTD/Archive/` (add one placeholder item in `GTD/Items/` from the template so I can see the format).
- **Nothing in `.obsidian/`.** Do not create CSS snippets and do not edit `appearance.json` or any other Obsidian config — the `Base Board` plugin needs no styling help from us.
- A short `README.md` at the root (append under an `## LLM-GTD` heading if one already exists — see safety note above) explaining: how to capture (new note, or web clipper import of `clipper/gtd-clipper-template.json`), that new notes auto-fill their frontmatter via the Templater folder-template set up in the manual steps, how to open `GTD/Board.base` and what its four views are (Board / Inbox / Stale / All items), that the board is rendered by the `Base Board` plugin, that each column shows the newest item first because every note is created with a `kanban_order` sort key (and that the Bases "Sort" setting does nothing on a board), and that dragging a card between columns rewrites `status` while dragging within a column replaces that column's `kanban_order` values with the order you dropped them in, that `/gtd-triage` and `/gtd-review` are the two day-to-day maintenance routines, that `/gtd-update` brings the vault up to date after a schema change, and that moving in from Notion or a CSV is a one-off job done by pasting the repo's `import-notion.md` prompt (there is no import skill — importing happens once, so it isn't worth installing).
- Log the initial setup as the first line in `GTD/Log.md`: `YYYY-MM-DD HH:MM [capture] Vault initialized (schema v7): board, template, schema, skills created.`

Before writing anything, confirm you understand the schema, then create all of the above in one pass and report what you made.

---

## Updating an existing vault

Already have LLM-GTD installed and want to pick up a schema change (like the `done`-field removal in v2)? Don't re-run this installer — use [`update.md`](update.md), a self-contained prompt that migrates a vault in place from whatever version it's on to the latest, non-destructively. Vaults installed from this version onward also get a `/gtd-update` skill that does the same job from inside the vault.

## Also

A polished single-page version of this same content — pitch, setup steps, and a copy-button prompt block — lives in [`install.html`](install.html). Open it in a browser and share the file directly, or paste its contents into an Artifact to get a shareable link.
