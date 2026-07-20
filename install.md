# Installing LLM-GTD elsewhere

A self-contained prompt for setting this system up in a fresh Obsidian vault — paste it into Claude Code after the one manual step below. It embeds the full schema, so Claude Code can write every file from scratch without needing access to this repo.

## One-time manual step

In Obsidian: Settings → Community plugins → enable, then install these six: `Dataview`, `Templater`, `Obsidian Kanban`, `kanban-bases-view`, `Obsidian Tasks Plugin`, `Icon Folder`. Enable all six. (`kanban-bases-view` needs Obsidian's Bases feature, so use a reasonably current version.)

No prompt can do this part — plugins are installed through Obsidian's own plugin browser.

## The prompt

Open a terminal at the vault's root and run Claude Code, then paste this in:

---

Set up a GTD (Getting Things Done) system in this Obsidian vault, following the "llm-wiki" idea (https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f): I capture and decide, you do the bookkeeping. Create the following files exactly as specified — don't improvise on the schema.

## 1. `CLAUDE.md` at the vault root

    # LLM-GTD — vault schema

    This vault is an Obsidian-based GTD (Getting Things Done) system maintained jointly by the human and Claude, following the llm-wiki idea: the human captures and decides, the LLM does the bookkeeping. This file is the schema — read it before touching anything.

    ## Layout

    ```
    GTD/Board.base    # kanban board (Bases + kanban-bases-view plugin) + Inbox/Stale/All views
    GTD/Items/        # one markdown note per GTD item — the ONLY place items live
    GTD/Archive/      # old done items, moved here by review
    GTD/Log.md        # append-only activity log
    Templates/GTD Item.md   # Templater template for new items
    clipper/          # Obsidian Web Clipper template
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
    done: false     # checkbox; done: true must eventually mean status: done (review syncs it)
    ---
    ```

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

    ## Operations

    - **capture** — create a note in `GTD/Items/` from the template with `status: inbox`. Do NOT process at capture time; capture must stay frictionless.
    - **triage** (`/gtd-triage`) — process the inbox: enrich (summarize `source` URLs into the body), tag, propose a destination status per item. llm-wiki's *ingest*.
    - **review** (`/gtd-review`) — the lint pass: flag stale items, sync `done`, archive old done items, surface someday items, spot duplicates. llm-wiki's *lint*.
    - **query** — answer questions from item notes ("what am I waiting for?", "what did I research about shoes?"). Read-only.

    ## Rules for the agent

    1. **Never delete** an item note. Cancelled → `status: done` with a `Cancelled: <reason>` line in the body. Old done items → move to `GTD/Archive/`.
    2. **Propose, then apply.** Triage and review present a batch proposal and wait for the human's confirmation before writing (the human decides; you file).
    3. **Bump `updated`** (YYYY-MM-DD) on every note you modify.
    4. **Log every operation** in `GTD/Log.md`: append-only, newest at the bottom, format `YYYY-MM-DD HH:MM [op] message`. Never rewrite existing lines.
    5. **Keep the tag vocabulary tight.** Before tagging, list tags already used across `GTD/Items/` and `GTD/Archive/` and reuse them; introduce a new tag only when nothing fits.
    6. **Don't touch** `.obsidian/` config or `GTD/Board.base` during item operations.
    7. Frontmatter must always match the schema above — no extra keys, no renamed keys.

## 2. `Templates/GTD Item.md` (Templater template — new notes in `GTD/Items/` auto-apply this)

    ---
    status: inbox
    tags: []
    created: <% tp.date.now("YYYY-MM-DD") %>
    updated: <% tp.date.now("YYYY-MM-DD") %>
    source:
    done: false
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
      note.done:
        displayName: Done
      note.source:
        displayName: Source
    views:
      - type: kanban-view
        name: Board
        order:
          - file.name
          - tags
          - done
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
        { "name": "source", "value": "{{url}}", "type": "text" },
        { "name": "done", "value": "false", "type": "checkbox" }
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

    1. **Collect.** Read frontmatter of all notes in `GTD/Items/`; select those with `status: inbox`, oldest `created` first. If none: say the inbox is empty and stop.

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

    5. **Apply confirmed changes only:** update frontmatter (`status`, `tags`), rename files via `mv` when approved, bump `updated` to today, keep `created` untouched.

    6. **Log.** Append one line per processed item to `GTD/Log.md`: `YYYY-MM-DD HH:MM [triage] "<title>" → <status> (tags: ...)`.

    7. **Report.** Summarize what moved where, and mention anything the user should decide later.

## 7. `.claude/skills/gtd-review/SKILL.md`

    ---
    name: gtd-review
    description: GTD weekly review / lint pass — flag stale items, sync done checkboxes, archive old done items, resurface someday items, spot duplicates. Use when the user asks for a review, weekly review, cleanup, or "what's rotting".
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
    6. **Done sync** — `done: true` but `status != done` → set `status: done`. `status: done` but `done: false` → set `done: true`.
    7. **Archive** — `status: done` with `updated` older than 30 days → move the file to `GTD/Archive/` (plain `mv`, keep the name).
    8. **Hygiene** — items with no tags, near-duplicate titles, frontmatter that deviates from the schema in `CLAUDE.md`.
    9. **Knowledge distillation** — for done items whose body holds lasting research (e.g. product comparisons, findings), offer to extract the essence into a permanent note outside `GTD/` (e.g. a `Wiki/` note) and link it from the item before it gets archived.

    ## Output

    1. Present a **review report** grouped by check, with a proposed action per finding (skip empty checks). Focus/next/waiting counts at the top give the board's health at a glance.
    2. Ask the user to confirm all / pick exceptions.
    3. Apply confirmed changes: frontmatter edits, `mv` to Archive, bump `updated` on every touched note.
    4. Append to `GTD/Log.md`: one `[review]` summary line plus one `[archive]` line per archived item.
    5. Close with the 1–3 things that most need the user's attention this week.

## 8. Also create

- Empty folders `GTD/Items/` and `GTD/Archive/` (add one placeholder item in `GTD/Items/` from the template so I can see the format).
- A short `README.md` at the root explaining: how to capture (new note, or web clipper import of `clipper/gtd-clipper-template.json`), how to open `GTD/Board.base` and what its four views are (Board / Inbox / Stale / All items), and that `/gtd-triage` and `/gtd-review` are the two maintenance routines.
- Log the initial setup as the first line in `GTD/Log.md`: `YYYY-MM-DD HH:MM [capture] Vault initialized: board, template, schema, skills created.`

Before writing anything, confirm you understand the schema, then create all of the above in one pass and report what you made.

---

## Also

A polished single-page version of this same content — pitch, setup steps, and a copy-button prompt block — lives in [`install.html`](install.html). Open it in a browser and share the file directly, or paste its contents into an Artifact to get a shareable link.
