# Installing LLM-GTD elsewhere

A self-contained prompt for setting this system up in an Obsidian vault — paste it into Claude Code after the one manual step below. It embeds the full schema, so Claude Code can write every file from scratch without needing access to this repo.

Works on a **fresh vault** or an **existing one**: almost everything the system creates is namespaced under `GTD/` (plus `clipper/` and the Claude skills), and the prompt below carries guard clauses so it merges into — rather than overwrites — a vault that already has content. The one thing it writes outside `GTD/` is a single namespaced CSS snippet (`.obsidian/snippets/gtd-kanban.css`) that keeps the board's cards tidy; beyond that it only reads and writes inside `GTD/`, so your existing notes are never touched.

## One-time manual steps

These happen in Obsidian's own UI — no prompt can do them.

1. **Install the plugins.** Settings → Community plugins → enable, then install these six: `Dataview`, `Templater`, `Obsidian Kanban`, `kanban-bases-view`, `Obsidian Tasks Plugin`, `Icon Folder`. Enable all six. (`kanban-bases-view` needs Obsidian's Bases feature, so use a reasonably current version.)

2. **Auto-fill frontmatter on new notes** — so items you create by hand in the inbox get `created`/`source` without thinking. Settings → Templater → turn on **Trigger Templater on new file creation**, then under **Folder Templates** add a mapping: folder `GTD/Items` → template `Templates/GTD Item.md`. Now any note you create in `GTD/Items/` is stamped with the schema frontmatter automatically. (Web-clipped notes already carry it; this covers the hand-made ones. Triage also backfills anything that still slips through.)

The board's cards are kept clean automatically: the prompt creates and enables a small CSS snippet (`.obsidian/snippets/gtd-kanban.css`) that hides the property-name labels, so a card reads `tag1 tag2` instead of `Tags: tag1 tag2`. You may just need to **reload Obsidian once** (Ctrl/Cmd+R) after setup for it to take effect.

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

    **Schema version: 3.** Version marker for migrations — the `/gtd-update` skill and the repo's `update.md` read the integer here to know which schema changes a vault still needs. Migrations bump it; don't edit it by hand.

    ## Layout

    ```
    GTD/Board.base    # kanban board (Bases + kanban-bases-view plugin) + Inbox/Stale/All views
    GTD/Items/        # one markdown note per GTD item — the ONLY place items live
    GTD/Archive/      # old done items, moved here by review
    GTD/Log.md        # append-only activity log
    Templates/GTD Item.md   # Templater template for new items
    clipper/          # Obsidian Web Clipper template
    .obsidian/snippets/gtd-kanban.css   # the ONE file written outside GTD/ — hides card property labels
    ```

    ## Item schema

    Every note in `GTD/Items/` and `GTD/Archive/` has this frontmatter — it is the single source of truth (the board just renders it):

    ```yaml
    ---
    status: inbox   # inbox | focus | next | someday | waiting | done
    tags: []        # lowercase, kebab-case; REUSE existing tags before inventing new ones
    created: YYYY-MM-DD
    updated: YYYY-MM-DD   # bump on EVERY meaningful change
    source:         # URL for web clips; empty otherwise
    ---
    ```

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
    - **query** — answer questions from item notes ("what am I waiting for?", "what did I research about shoes?"). Read-only.

    ## Rules for the agent

    1. **Never delete** an item note. Cancelled → `status: done` with a `Cancelled: <reason>` line in the body. Old done items → move to `GTD/Archive/`.
    2. **Propose, then apply.** Triage and review present a batch proposal and wait for the human's confirmation before writing (the human decides; you file).
    3. **Bump `updated`** (YYYY-MM-DD) on every note you modify.
    4. **Log every operation** in `GTD/Log.md`: append-only, newest at the bottom, format `YYYY-MM-DD HH:MM [op] message`. Never rewrite existing lines.
    5. **Keep the tag vocabulary tight.** Before tagging, list tags already used across `GTD/Items/` and `GTD/Archive/` and reuse them; introduce a new tag only when nothing fits.
    6. **Don't touch** `.obsidian/` config or `GTD/Board.base` during item operations. The sole exception to writing outside `GTD/` is the `gtd-kanban` CSS snippet — and even that is only created/enabled by `/gtd-update`, never during capture/triage/review.
    7. Frontmatter must always match the schema above — no extra keys, no renamed keys.

## 2. `Templates/GTD Item.md` (Templater template — the folder-template step in the manual setup applies this to every new note in `GTD/Items/`)

    ---
    status: inbox
    tags: []
    created: <% tp.date.now("YYYY-MM-DD") %>
    updated: <% tp.date.now("YYYY-MM-DD") %>
    source:
    ---

## 3. `GTD/Board.base` (Bases file — needs the `kanban-bases-view` plugin)

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
      - type: kanban-view
        name: Board
        order:
          - tags
        groupByProperty: note.status
        columnOrders:
          note.status:
            - inbox
            - focus
            - next
            - someday
            - waiting
            - done
        quickAddFolder: GTD/Items
        cardOrders:
          note.status: {}
        columnColors:
          note.status: {}
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

The **kanban view's** `order:` lists only `tags` on purpose: the card already shows the note name as its title, so listing `file.name` there would print the name a second time. The **table** views keep `file.name` because a table needs it as a column.

## 4. `GTD/Log.md`

    # GTD Log

    Append-only activity log. Newest entries at the bottom. One line per action, format:

    `YYYY-MM-DD HH:MM [op] message`

    Ops: `[capture]` `[triage]` `[review]` `[archive]` `[migrate]`

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
        { "name": "source", "value": "{{url}}", "type": "text" }
      ],
      "triggers": []
    }

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

    5. **Apply confirmed changes only:** update frontmatter (`status`, `tags`), rename files via `mv` when approved, bump `updated` to today, keep `created` untouched. Also backfill schema gaps on every processed item: if `created` is missing, set it to the note's file-creation date (fall back to today); if the `source` key is absent, add an empty `source:`. This heals hand-made notes that bypassed the template.

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

    CANONICAL_SOURCE: (unset)

    The always-latest copy of this skill and its changelog lives in the repo's `update.md`. `CANONICAL_SOURCE` says where to find it — that's how `/gtd-update` learns about migrations authored *after* this skill was installed. Two forms work:

    - **A public raw URL** — preferred: it works on any machine, needs no clone, and sees changes the moment they're pushed. E.g. `https://raw.githubusercontent.com/<owner>/<repo>/main/update.md`. Use the `raw.` host; a `github.com/...` link serves an HTML page, not the file.
    - **A local file path** to a clone's copy — e.g. `~/devel/scriptchemy/scripts/obsidian-llm-gtd/update.md`. Use this when the repo is private, when you're offline, or when you want the check to see migrations you've written but not yet pushed. Requires the clone to be present and pulled.

    Set it once (step 2) and future runs check it automatically.

    ## Steps

    1. **Read the vault version** from `CLAUDE.md` (`Schema version: N`; absent → 1).

    2. **Self-check for a newer changelog.**
       - If `CANONICAL_SOURCE` is `(unset)`: ask me for it — the public raw URL of the repo's `update.md`, or a local path to my clone's copy (see above). If I give one, write it into the `CANONICAL_SOURCE:` line above so it persists for next time. If I decline, skip to step 3 using the baked-in changelog and warn that the latest-version check was skipped.
       - If `CANONICAL_SOURCE` is set, read it — fetch it if it's a URL, read the file if it's a path:
         - **Reachable, and its highest `### vX → vY` entry is newer than the top of my baked-in changelog** → I'm stale. Use *that file's* changelog (its steps, not mine) for planning and applying. After applying, overwrite this `SKILL.md` with the `gtd-update` skill embedded in that file, but **keep my current `CANONICAL_SOURCE` value** — re-inject it, don't revert it to `(unset)`.
         - **Reachable but not newer** → I'm current; use my baked-in changelog.
         - **Unreachable** (path moved, clone missing, URL 404/private, offline, fetch blocked) → warn, say which source failed, fall back to the baked-in changelog, and remind me I can run `update.md` manually.

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

## 9. Also create

- Empty folders `GTD/Items/` and `GTD/Archive/` (add one placeholder item in `GTD/Items/` from the template so I can see the format).
- **`.obsidian/snippets/gtd-kanban.css`** containing `.obk-card-property-label { display: none; }`, and enable it by adding `"gtd-kanban"` to the `enabledCssSnippets` array in `.obsidian/appearance.json` (create the file and/or the array if absent; **preserve every other key and any snippets already listed** — read-modify-write, never overwrite). This is the only file written outside `GTD/`; it hides the property-name labels on kanban cards. Tell me to reload Obsidian (Ctrl/Cmd+R) once so it takes effect, and note that if Obsidian was open while you wrote `appearance.json` it may overwrite the edit on exit — I can just re-enable the snippet in Settings → Appearance → CSS snippets.
- A short `README.md` at the root (append under an `## LLM-GTD` heading if one already exists — see safety note above) explaining: how to capture (new note, or web clipper import of `clipper/gtd-clipper-template.json`), that new notes auto-fill their frontmatter via the Templater folder-template set up in the manual steps, that the `gtd-kanban` CSS snippet keeps cards tidy (reload Obsidian once if labels still show), how to open `GTD/Board.base` and what its four views are (Board / Inbox / Stale / All items), that `/gtd-triage` and `/gtd-review` are the two day-to-day maintenance routines, and that `/gtd-update` brings the vault up to date after a schema change.
- Log the initial setup as the first line in `GTD/Log.md`: `YYYY-MM-DD HH:MM [capture] Vault initialized (schema v3): board, template, schema, skills created.`

Before writing anything, confirm you understand the schema, then create all of the above in one pass and report what you made.

---

## Updating an existing vault

Already have LLM-GTD installed and want to pick up a schema change (like the `done`-field removal in v2)? Don't re-run this installer — use [`update.md`](update.md), a self-contained prompt that migrates a vault in place from whatever version it's on to the latest, non-destructively. Vaults installed from this version onward also get a `/gtd-update` skill that does the same job from inside the vault.

## Also

A polished single-page version of this same content — pitch, setup steps, and a copy-button prompt block — lives in [`install.html`](install.html). Open it in a browser and share the file directly, or paste its contents into an Artifact to get a shareable link.
