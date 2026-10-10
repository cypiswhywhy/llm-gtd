# LLM-GTD — vault schema

This vault is an Obsidian-based GTD (Getting Things Done) system maintained jointly by the human and Claude, following the llm-wiki idea: the human captures and decides, the LLM does the bookkeeping. This file is the schema — read it before touching anything.

**Schema version: 15.** Version marker for migrations — the `/gtd:update` skill reads the integer here to know which schema changes a vault still needs. Migrations bump it; don't edit it by hand.

## Layout

The skills (`/gtd:triage`, `/gtd:review`, …) come from the `gtd` Claude Code plugin, enabled for this vault in `.claude/settings.json`; the vault holds no copy of them.

```
GTD/Board.base    # kanban board (Bases + Base Board plugin) + Inbox/Stale/All views
GTD/Items/        # one markdown note per GTD item — the ONLY place items live
GTD/Projects/     # one note per project — the plan for a multi-step outcome, never on the board
GTD/Archive/      # old done items, moved here by review
GTD/Attachments/  # files an import brought with it — created on demand
GTD/Log.md        # append-only activity log (GTD and Pocket)
Pocket/Board.base # Pocket board — one column per category + All view
Pocket/Notes/     # one note per piece of content worth keeping — the ONLY place Pocket notes live
Templates/GTD Item.md     # Templater template for new items
Templates/Pocket Note.md  # Templater template for the Pocket board's + button
clipper/          # Obsidian Web Clipper templates (GTD inbox, Pocket)
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
project:        # OPTIONAL — "[[Project name]]" when this item is a step of a project
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

An item that is a step of a project carries `project: "[[Project name]]"` — a name-only wikilink to
its note in `GTD/Projects/`. The key is **absent on every item that isn't a project step**: neither
the Templater template nor the web clipper writes it, so an ordinary capture never has it, and only
`/gtd:project` adds it.

## Projects

A **project** is an outcome that needs more than one action — "buy a flat", "get a tattoo", "plan
the holiday", "quit smoking". Projects live in `GTD/Projects/`, one note each, and they are **not
items**: they never appear on the board, they are never dragged, and they carry no `kanban_order`.

The split exists because a project's plan must not become twenty cards. The plan lives as a
checklist inside the project note; only the **active step** exists as a real item in `GTD/Items/`.
Every other step is plain text until its turn comes.

Project note frontmatter:

```yaml
---
status: active   # active | someday | waiting | done — projects have their own vocabulary
tags: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
wip: 1           # how many of this project's steps may sit on the board at once
outcome: "one sentence — how I'll know this project is finished"
---
```

`status: done` is still the only completion signal. The vocabulary differs from an item's because a
project is never on the board: `active` (being worked), `someday` (kept, no timeline), `waiting`
(blocked on another party), `done` (finished, or abandoned with a `Cancelled: <reason>` line).

`wip` is 1 unless the human raises it. Raise it only for tracks that genuinely run side by side (a
renovation where choosing a contractor and choosing materials really are parallel) — never to get
more done at once, which is how a project turns back into twenty cards.

Body shape:

```markdown
## Outcome
One sentence, the same one as in the frontmatter.

## Steps
- [x] Collect 5 reference photos ~10m → [[Collect tattoo references]] ✅ 2026-09-10
- [ ] Call 3 studios for a quote ~20m → [[Call 3 tattoo studios]]
- [ ] Pick a studio and pay the deposit ~30m
- [ ] Book the date ~5m

## Notes
Decisions, links, research — whatever the project accumulates.
```

Every step is written as a physical action — a verb the human can start without deciding anything
first — with a rough estimate appended (`~10m`, `~45m`, `~2h`). "Research studios" is not a step;
"open Instagram, search #tattoowarsaw, paste 3 profiles into the project note ~10m" is. A step
estimated at more than about two hours is really two steps.

Three rules keep the checklist and the items from drifting apart:

1. **The checklist is the plan; items are the work.** A step becomes a note in `GTD/Items/` only
   when it is promoted, and promotion appends `→ [[Item name]]` to its checklist line.
2. **A checklist line is never deleted.** Finished → `- [x]` plus `✅ YYYY-MM-DD`. Abandoned →
   `- [x] ~~text~~ (cancelled: reason)`. The checklist is the project's history.
3. **Link by note name, never by path** (`[[Call 3 tattoo studios]]`). Review moves done items into
   `GTD/Archive/`; a name-only wikilink survives that move, a path-based one breaks.

A done project stays in `GTD/Projects/` — it is the record of how the thing got done. Projects are
never archived; `GTD/Archive/` is for items.

## Pocket

**Pocket** is the human's shelf of content worth keeping — an article, a recipe, a tool, a
reference. GTD holds only things *to do*; Pocket holds things *to keep*. The usual path: an article
is captured into GTD, read, dragged to `done`, and — if it is worth keeping — moved to Pocket. Content
can also skip GTD and go straight into Pocket through the Pocket web-clipper template.

Pocket is **independent of GTD**: its own folder (`Pocket/Notes/`), its own board
(`Pocket/Board.base`), its own frontmatter and its own tag vocabulary. A Pocket note is not an item:
it has no `status`, never appears on the GTD board, and is never archived.

Pocket note frontmatter:

```yaml
---
category: articles   # the Pocket board column — exactly one value, or empty while unsorted
tags: []             # Pocket's own vocabulary — lowercase, kebab-case, never mixed with GTD tags
created: YYYY-MM-DD  # when the content was first captured — carried over from the GTD item
updated: YYYY-MM-DD
source:              # URL for web content; empty otherwise
kanban_order: -1786636800000   # Pocket board sort key — same write-once rule as on items
---
```

`category` decides the column. The board starts with the categories listed in `Pocket/Board.base`
(`articles`, `reference`, `ideas`, `tools`, or their equivalents in the human's language). Reuse an
existing category before inventing one. A new value needs no board edit: `Base Board` adds a column
for it at the right-hand end, and the human drags columns into order. An empty `category` puts the
note in the first column, `(No value)` — Pocket's unsorted pile, filled by the Pocket clipper and the
board's `+` button, and emptied by `/gtd:pocket`. Categories are few and broad (the column is where
you look); tags are many and narrow (the filter is how you find).

Moving an item from GTD to Pocket — `/gtd:pocket` does it, `/gtd:triage` and `/gtd:review` propose it:

1. **Only a `status: done` item moves.** Something still to be done stays in GTD. If the human wants
   to keep an item that isn't done, the same proposal marks it done first.
2. **The file moves, it is not copied** — `mv` from `GTD/Items/` (or `GTD/Archive/`) to
   `Pocket/Notes/`, keeping the name, so nothing is left behind in GTD.
3. **The frontmatter becomes a Pocket note's**: `status` and `project` are dropped; `created` and
   `source` are kept; `category` and `tags` are set from the Pocket vocabulary (the GTD tags are
   dropped — they described the task, not the content); `updated` is today; `kanban_order` is stamped
   fresh with minus the move time in milliseconds, because it is a new card on a new board and should
   land at the top of its column.
4. **The body is kept as it is.** The title may be renamed from the task to the content (`Read Paul
   Graham's essay on great work` → `How to Do Great Work (Paul Graham)`), but only when no note links
   to it by name — a rename breaks those links.

Notes can also come from elsewhere in the vault: `/gtd:pocket-import <folder>` reviews a folder the
human names and moves only the notes they confirm. An imported note keeps any frontmatter keys it
arrived with, except `status`, alongside the Pocket ones.

A Pocket note never moves back into GTD. To act on it again, capture a new item that links to it.

## Operations

- **capture** — create a note in `GTD/Items/` from the template with `status: inbox`. Do NOT process at capture time; capture must stay frictionless. New notes get their frontmatter from the Templater folder-template (a one-time Obsidian setting — see the README); any hand-made note that's missing `created` or `source` is backfilled at triage.
- **triage** (`/gtd:triage`) — process the inbox: enrich (summarize `source` URLs into the body), tag, propose a destination status per item. llm-wiki's *ingest*.
- **review** (`/gtd:review`) — the lint pass: surface stalled projects, flag stale items, archive old done items, surface someday items, spot duplicates. llm-wiki's *lint*.
- **project** (`/gtd:project`) — turn a multi-step outcome into a `GTD/Projects/` note with a step checklist, and keep exactly `wip` of its steps on the board. With a description it plans (or re-plans) one project; with no argument it sweeps every active project and promotes the next step of any that has room.
- **pocket** (`/gtd:pocket`) — keep content: move done items from GTD into `Pocket/Notes/` with a category and tags, and sort Pocket's unsorted pile. Given item names it moves those; with no argument it sorts the `(No value)` column and lists done items that look worth keeping.
- **pocket import** (`/gtd:pocket-import <folder>`) — review every note in a folder the human names, recommend Pocket or leave for each, and move only the confirmed ones into `Pocket/Notes/`. The rest stay untouched.
- **import** — bulk-load an existing system (a Notion export, a CSV) into `GTD/Items/` by pasting the repo's `import-notion.md` prompt: it surveys the export, proposes a status/tag/field map, then writes. A capture operation — the thinking happens afterwards at triage.
- **query** — answer questions from item and Pocket notes ("what am I waiting for?", "what did I keep about sleep?"). Read-only.

## Rules for the agent

1. **Never delete** an item note, a project note or a Pocket note. Cancelled → `status: done` with a `Cancelled: <reason>` line in the body. Old done items → move to `GTD/Archive/`.
2. **Propose, then apply.** Triage and review present a batch proposal and wait for the human's confirmation before writing (the human decides; you file).
3. **Bump `updated`** (YYYY-MM-DD) on every note you modify.
4. **Log every operation** in `GTD/Log.md`: append-only, newest at the bottom, format `YYYY-MM-DD HH:MM [op] message`. Never rewrite existing lines.
5. **Keep the tag vocabularies tight — there are two, and they never mix.** Before tagging an item, list tags already used across `GTD/Items/` and `GTD/Archive/`; before tagging a Pocket note, list those used across `Pocket/Notes/`. Reuse from the matching vocabulary; introduce a new tag only when nothing there fits.
6. **Don't touch** `.obsidian/` config, `GTD/Board.base` or `Pocket/Board.base`, ever — not during item operations, and not during `/gtd:update`. Everything this system writes lives under `GTD/`, `Pocket/`, `Templates/GTD Item.md`, `Templates/Pocket Note.md` and `clipper/`. The one exception is `/gtd:pocket-import`: it reads the folder the human names and moves the notes they confirm out of it into `Pocket/Notes/`, and does nothing else there.
7. Frontmatter must always match the schema above — no renamed keys, and no extra keys of your own. Three exceptions are part of the schema, not deviations from it: `project` appears only on an item that is a project step, a project note carries its own keys (`wip`, `outcome`, and no `kanban_order`), and a Pocket note carries its own (`category`, and no `status`) — plus, if it was imported, the keys it arrived with. `kanban_order` is the one key with split ownership: stamp it on an item or Pocket note you create (minus the creation timestamp in milliseconds) and on a note you move into Pocket (minus the move time), and preserve any value you find untouched.
8. **Write as the human.** Everything you put into a note — a title, a project step, a summary, a line of body text — reads as if the human wrote it for themselves: in their language, in their voice, never addressed to them. A task is named the way a person writes it on their own list, not as an order to a reader; where a language has a distinct form for that, use it (Polish "Zadzwonić do banku", not "Zadzwoń do banku"; German "Bank anrufen", not "Ruf die Bank an"). In English the bare verb ("Call the bank") already is that form. The rule covers what you write, not what the human already wrote: never rewrite their text only to change its form. Your replies in the conversation are still addressed to the human.
9. **Answer in the human's language, and number what you propose.** Your replies in the conversation — reports, questions, proposals — are in the language the human writes to you in; their own messages decide, not the language of this file or of the skills. Every proposal that waits for their confirmation numbers its rows `#1`, `#2`, … in one sequence across the whole proposal, so they can answer "all except #4" or "#7 → someday" without quoting a row back.
