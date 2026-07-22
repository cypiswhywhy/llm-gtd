# Moving an existing system into an LLM-GTD vault

A self-contained prompt for bulk-loading an existing task system — a **Notion** export, or any
plain CSV — into a vault that already has LLM-GTD installed. Paste it into Claude Code at the
vault's root. It surveys the export, proposes a mapping from the old status vocabulary onto the
six GTD statuses, folds the old tags onto the vault's existing tag vocabulary, and only then
writes item notes. Propose-then-apply, logged, non-destructive, and nothing outside `GTD/`.

- **No LLM-GTD yet?** Run [`install.md`](install.md) first — this prompt writes items against a
  schema that has to already be there.
- **From inside the vault**, the installed `/gtd-import` skill does the same job. This file is the
  canonical copy of that skill: `/gtd-update` fetches it from here when it migrates a vault to
  schema v5, and running this prompt installs (or repairs) the skill too.

## Exporting from Notion first

In Notion: **⋯ → Export**, and choose:

| Setting | Value |
|---|---|
| Export format | **Markdown & CSV** — *not* HTML or PDF |
| Include content | **Everything** |
| Include databases | **All rows** (not just the current view) |
| Create folders for subpages | **On** |

You get a `.zip` — several `-Part-N.zip` files if the workspace is large. Export at the workspace
level to get everything, or export a single database if you only want that one. A CSV-only export
works too; you just get properties without page bodies.

## Where to put the export

**Make a folder called `.gtd-import/` at the root of your vault and drop the zip (or zips) in.**
That's it — you don't need to unzip anything.

```
your-vault/
  .gtd-import/          ← drop Export-abc123.zip here
  GTD/
  CLAUDE.md
```

The leading dot is the whole trick: **Obsidian ignores dot-folders**, so an export can sit inside
the vault without being indexed, without stray Notion pages appearing in search, and without
anything landing on your board. And because Claude Code already runs at the vault root, the import
finds it with no path to type.

You don't *have* to use it. The import looks in these places, in order, before it asks you anything:

1. `.gtd-import/` at the vault root — the documented spot
2. the vault root itself — a stray `Export-*.zip`
3. `~/Downloads/` — where your browser actually put it, and usually where it still is
4. the vault's parent folder

So in practice you can also just leave the zip in Downloads and say "import my Notion export".

Two cautions:

- **If your vault is a git repo**, add `.gtd-import/` to `.gitignore` before you start. A Notion
  export runs to hundreds of megabytes. The import checks this and offers to add the line.
- **Don't unzip into a normal folder inside the vault** (`Notion export/`, `Import/`). That one
  Obsidian *does* index, and you get hundreds of untracked pages in your vault. Dot-folder or
  outside the vault — nothing in between.

Once the import finishes, `.gtd-import/` is yours to delete. Nothing references it afterwards.

## The prompt

Open a terminal at the vault's root, run Claude Code, and paste this in:

---

Import an existing task system into this LLM-GTD Obsidian vault. The vault already has LLM-GTD installed (a `CLAUDE.md` schema, `GTD/` with a board and item notes, and the `/gtd-triage`, `/gtd-review`, `/gtd-update` skills) — read that `CLAUDE.md` first and treat it as binding.

**Find the export yourself before asking me where it is** — check `.gtd-import/` at the vault root, then the vault root, then `~/Downloads/`, then the vault's parent folder. Tell me what you found and which one you're using. Only ask for a path if none of those turn anything up.

Do not write anything until you have surveyed the export and I have confirmed your mapping. Never modify anything inside the export folder, never overwrite an existing note, and never write outside `GTD/` (unzipping into the staging folder is the one exception, and only when you tell me first).

## What to do

1. **Follow the `gtd-import` skill printed at the end of this prompt** against my export: survey it, present the mapping proposal it describes, wait for my confirmation, then write in batches.
2. **Install the skill.** Create or overwrite `.claude/skills/gtd-import/SKILL.md` with the exact content printed below — unindented, verbatim, from its frontmatter to the end — so `/gtd-import` is available in this vault from now on.
3. **Check the schema version** in `CLAUDE.md`. `/gtd-import` arrived in schema **v5**, which also adds the `GTD/Attachments/` folder and the `[import]` log op. If this vault is below v5, tell me at the end that running `/gtd-update` (or the repo's `update.md`) will bring the rest of v5 in — but go ahead with the import regardless; it doesn't depend on the marker.
4. **Report** as the skill's final step describes, including what did not survive the conversion.

## The `/gtd-import` skill — the source of truth for imports

Follow this against my export, then write it verbatim to `.claude/skills/gtd-import/SKILL.md`:

    ---
    name: gtd-import
    description: Import an existing task system into this LLM-GTD vault — a Notion "Markdown & CSV" export, or a plain CSV. Surveys the export, proposes a status/tag/field mapping, then writes GTD item notes. Use when the user wants to migrate from Notion, import a Notion export, or bulk-load items from a CSV.
    ---

    # GTD import (Notion, CSV → vault)

    Bulk-load an existing task system into `GTD/Items/`. Follow the schema and rules in the vault's `CLAUDE.md` — especially propose-then-apply, the tag-vocabulary rule, and never writing outside `GTD/`.

    Import is a **capture** operation, not a triage. The goal is to get everything in, correctly statused and tagged, with nothing silently lost. Deciding what actually deserves attention comes afterwards, from `/gtd-triage` and `/gtd-review`.

    ## Ground rules

    - **The export is read-only.** Never write into, move, or delete anything inside it. When the import finishes, tell the user it's safe to delete — don't delete it.
    - **Never overwrite an existing item note.** Collisions get reported; the user decides.
    - **Nothing outside `GTD/`,** with exactly one exception: unzipping the export into the staging folder `.gtd-import/` (step 1). That folder is scratch space the user owns, not vault content, and you say so before creating it. Items go to `GTD/Items/` (or `GTD/Archive/`), attachments to `GTD/Attachments/`. Notion pages that aren't tasks — wiki pages, meeting notes, reference docs — are **out of scope**: list them at the end so the user can place them, but don't file them anywhere.
    - **Resumable.** Every imported item records its Notion page id in its body. A second run skips any id already present in the vault, so a partial import can be finished and never doubled.

    ## Step 1 — Find, stage, and identify the export

    **Look before you ask.** You are running at the vault root, so search these, in order, and stop at the first that yields something:

    1. **`.gtd-import/`** — the documented drop folder. This is where the user is told to put the export; a leading dot keeps Obsidian from indexing it.
    2. **the vault root** — a stray `Export-*.zip`, or a folder whose name ends in a space plus 32 hex characters.
    3. **`~/Downloads/`** — where the browser put it by default, and usually where it still is. Match `Export-*.zip`, `*Notion*`, and any folder ending in a 32-hex id.
    4. **the vault's parent folder** — a sibling of the vault.

    Say what you found and which candidate you're using. If several look plausible, list them with their sizes and dates and ask which. **Never scan the whole home directory or the whole disk** — those four locations, then ask.

    If nothing turns up, don't just ask for a path — give the user the short answer: *"Create a `.gtd-import/` folder at the vault root, drop the Notion zip in, and re-run — or tell me the path."*

    **Staging.** If what you found is one or more `.zip` files:

    - Unzip **every part** into `.gtd-import/unzipped/` (create `.gtd-import/` if needed — say so first; it's the one thing this skill writes outside `GTD/`). Missing a `-Part-2.zip` means silently importing a fraction of the workspace.
    - **If the vault is a git repo** (`.git/` at the root), check that `.gtd-import/` is ignored, and offer to add it to `.gitignore` before unzipping. A Notion export is easily hundreds of megabytes; committing it is nobody's intent.
    - Once unzipped, that tree is read-only for the rest of the run.

    If the export is already unzipped in a **normal (non-dot) folder inside the vault**, warn the user: Obsidian is indexing those pages right now, and they'll surface in search and possibly on the board. Offer to move the folder into `.gtd-import/`. Never leave it and say nothing.

    Then work out the export's shape:

    | What's there | What it is |
    |---|---|
    | `Export-<uuid>.zip`, possibly `-Part-1`, `-Part-2`, … | Notion Markdown & CSV export, still zipped — stage it as above, then survey `.gtd-import/unzipped/` |
    | folders and `.md` files whose names end in a space plus 32 hex characters | an unzipped Notion Markdown & CSV export |
    | `.csv` files only | Notion CSV-only export, or a hand-made CSV — properties without page bodies |
    | `.html` files | Notion **HTML** export — stop and ask for a re-export as **Markdown & CSV**. HTML loses property typing and maps badly. |

    ## Step 2 — Survey before touching anything

    Read only. Produce one survey report covering:

    1. **Databases.** Per `*.csv`: name (id suffix stripped), row count, column list. Notion often writes both `Name <id>.csv` (the exported *view* — filtered, only visible columns) and `Name <id>_all.csv` (every row, every column). **Prefer `_all` when both exist**, and say which you used — using the view file silently loses rows.
    2. **Candidate status column** per database: the select/status column whose values look like workflow stages, with a count per distinct value. Also flag checkbox columns named like `Done` or `Complete`.
    3. **Candidate tag columns**: multi-selects, non-status selects, and anything named `Tags`, `Category`, `Area`, `Project`, `Type`.
    4. **Candidate date columns**: `Created time`, `Last edited time`, `Due`, `Date`. Notion only exports columns that were *visible in the exported view*, so `Created time` is often simply absent — note what's missing.
    5. **URL columns** — anything holding links.
    6. **Page bodies** — how many rows have a matching `.md` with content beyond the property block, and roughly how much.
    7. **Attachments** — count of local files (images, PDFs) referenced from page bodies.
    8. **Loose pages** — `.md` files belonging to no database. These are the out-of-scope ones: count and list them, import nothing.
    9. **The vault as it stands** — item count in `GTD/Items/`, and the full existing tag vocabulary (needed for step 3d).

    ## Step 3 — Propose the mapping, then wait

    Present all of the below as one proposal and **write nothing until the user confirms**. Any part of it may be overridden.

    **a. Status map.** One row per distinct source status value → one of `inbox | focus | next | someday | waiting | done`, with row counts. Defaults (case-insensitive, emoji stripped):

    | Source value | GTD status |
    |---|---|
    | Inbox, Capture, Triage, Unsorted, New | `inbox` |
    | In progress, Doing, Active, Current, Started, This week | `focus` |
    | To do, Next, Up next, Ready, Not started, Planned | `next` |
    | Someday, Backlog, Ideas, Maybe, Icebox, On hold, Later | `someday` |
    | Waiting, Waiting on, Blocked, Delegated, In review, Needs feedback | `waiting` |
    | Done, Complete, Completed, Shipped, Closed, Cancelled, Archived, checked `Done` box | `done` |
    | *no status column, or empty* | `inbox` |

    Anything that doesn't clearly fit: propose `inbox` and flag it — triage sorts it out later.

    **b. The focus cap.** `CLAUDE.md` wants Focus at 3–5 items. If the map would put more than 5 there, say so and propose keeping the N most-recently-edited as `focus`, demoting the rest to `next`. A board that opens with forty items in Focus is worse than no board.

    **c. Done routing.** Items mapping to `done` whose last-edited date is **older than 30 days** go straight to `GTD/Archive/` — that's what `/gtd-review` would do to them anyway, and it keeps the board readable. Report the split (`N done → Archive`, `M done → Items`). With no date to judge by, archive all `done` items and say so.

    **d. Tag map.** Propose the concrete tag list: which columns feed tags, and the normalisation (lowercase, kebab-case, emoji and punctuation stripped, spaces → `-`). Apply `CLAUDE.md` rule 5 **before** proposing: match candidates against the vault's existing tags and fold near-matches onto what's already there (`Reading` → the existing `reading`, not a second variant). Show the new-tag count; if the import would introduce more than ~25 new tags, propose dropping the long tail — tags used once or twice carry no signal.

    Optionally add one tag per source database (`notion-tasks`, `notion-reading`): useful when importing several databases, noise when importing one. Propose it and let the user choose.

    **e. Field map.** State exactly where each frontmatter value comes from, and its fallbacks:

    - `status` — the status map above
    - `tags` — the tag map above
    - `created` — `Created time` column → else the earliest date column on the row → else today
    - `updated` — `Last edited time` column → else `created`
    - `source` — **only** a genuine URL property (a bookmark, an article link). Leave it **empty** otherwise. Do **not** put the `notion.so` page URL here: `/gtd-triage` fetches `source` and summarises it, and it would fail on every private Notion page, wasting the entire triage batch. The Notion link belongs in the body (step 4).
    - **No other keys, ever** (`CLAUDE.md` rule 7). Every source property with no slot in the schema goes into the body, not into frontmatter.

    **f. Titles.** Show 10 sample before/after filenames so bad cases surface early. Rules:

    - strip the trailing Notion id — a space then 32 hex characters, or a space then a hyphenated UUID
    - URL-decode `%20` and friends
    - replace `/ \ : * ? " < > | # ^ [ ]` with `-`, collapse whitespace runs, trim, cap at ~100 characters
    - empty or id-only title → `Untitled item 1`, `Untitled item 2`, …
    - collision *within the batch* → append ` (2)`, ` (3)`
    - collision with a note **already in the vault** → default to **skip and report**; ask whether the user would rather suffix them or reconcile by hand

    **g. Scale.** Totals: items to create, attachments to copy, items to skip. Above ~200 items, confirm once more before starting.

    ## Step 4 — Write, in batches of about 25

    Only after confirmation.

    **Frontmatter** exactly as `CLAUDE.md` specifies, values from the field map, no extra keys.

    **Body**, in this order:

    1. The page's markdown content, cleaned:
       - drop the leading `# Title` heading — the filename already carries it
       - drop Notion's plain-text property block at the top of the file (the `Status: Done` / `Tags: x, y` lines before the first blank line); it's already captured in frontmatter and in `## Imported`
       - internal links `[Some Page](Some%20Page%20<id>.md)` → `[[Some Page]]` **if that page was also imported**; otherwise keep the link text as plain text and drop the dead target
       - image and file links pointing inside the export → copy the file to `GTD/Attachments/<item-slug>/<filename>` and rewrite the link to that path
       - leave `- [ ]` checkboxes exactly as they are — the Tasks plugin reads them
       - leave `<details>` toggles and callout blocks alone; don't prettify
    2. A `## Imported` section, **always**, holding:
       - `From Notion — <database name> · [original page](https://www.notion.so/<id>) · imported YYYY-MM-DD`
       - `notion-id: <32-hex id>` — the resume key; a re-run skips any id already present in the vault
       - **Unmapped properties** on one line, e.g. `Priority: High · Assignee: Me · Due: 2026-08-01` — everything the source carried that the GTD schema has no slot for. Never drop a property silently.
       - Parent, sub-item, and relation links as `[[Other item]]` where the other side was imported. Notion sub-tasks **flatten**: every row becomes its own item and the hierarchy survives as links in the body, never as new frontmatter keys.

    Write each file into `GTD/Items/`, or `GTD/Archive/` per the done-routing rule.

    After each batch, report progress (`50/312 …`) so a long import stays visible and interruptible.

    ## Step 5 — Log

    Append to `GTD/Log.md`, newest at the bottom:

    - one `YYYY-MM-DD HH:MM [import] "<title>" ← Notion/<database> → <status>` line per item created
    - a closing `YYYY-MM-DD HH:MM [import] Notion import: N items (a inbox, b focus, c next, d someday, e waiting, f done), g archived, h skipped, i attachments` summary line

    For very large imports, collapse the per-item lines to one per batch and keep the summary line.

    ## Step 6 — Report

    1. **The board's shape** after import: count per status.
    2. **Skipped** items and why — collision, no title, unreadable.
    3. **Out of scope**: the loose pages you did not import, listed, with the reminder that the import writes nothing outside `GTD/`, so placing them is the user's call.
    4. **What didn't survive.** Notion formulas, rollups, synced blocks, database views, comments, and page history have no equivalent here. Name what was dropped instead of implying everything mapped.
    5. **Next steps**: run `/gtd-triage` on whatever landed in `inbox`, then `/gtd-review` for a first honesty pass. `.gtd-import/` (or wherever the export came from) is now safe for the user to delete — say so, name the path, and don't delete it yourself.

    ## Notion export anatomy (reference)

    What bites when parsing a Markdown & CSV export:

    - **Every** file and folder name ends in a space plus the page's 32-hex id. The same id appears in the page URL, which is how you rebuild `https://www.notion.so/<id>`.
    - A database exports as `Name <id>.csv` **plus** a folder `Name <id>/` holding one `.md` per row. The CSV is the reliable property source (typed, complete); the `.md` property block is a fallback and is easy to confuse with body content.
    - Rows with an empty title still export, with an id-only filename.
    - CSV dates come out as `July 22, 2026` or `2026-07-22`, sometimes with a time, sometimes as a range `A → B`. Take the start of a range. Normalise everything to `YYYY-MM-DD`.
    - Multi-select values are comma-separated **inside one CSV cell**, and the values themselves may contain commas — use a real CSV parser, never a split on commas.
    - Attachments live in a per-page folder beside the `.md`, referenced by URL-encoded relative paths.
    - Large exports arrive as several zip parts; unzip all of them into one directory before surveying, or you'll import a fraction and not notice.

    ## CSV-only imports

    The same flow with steps trimmed: no bodies, no attachments, no internal links. Survey the columns, ask which one is the title, propose the status/tag/field map, and write one item per row whose body is just the `## Imported` block (with the unmapped-properties line). Everything else — propose-then-apply, collision handling, logging, reporting — is unchanged.

---

Ask me for the export path, survey it, and show me the mapping before you write anything.

---

## Keeping this file in sync

This file is the **only** copy of the `gtd-import` skill. `install.md` and `update.md` don't embed
it — they fetch it from here, so there is nothing to mirror when it changes:

- `install.md` §9 ("Also create") fetches it as an optional step during a fresh install.
- The `### v4 → v5` changelog entry resolves it relative to the vault's `CANONICAL_SOURCE`
  (same directory, filename `import-notion.md`) and installs it during `/gtd-update`.

That means **pushing a change to this file changes what installed vaults get on their next
`/gtd-update`** — the same live-deploy property `update.md` has. If you move the repo, the
relocation rule in `/gtd-update` moves `CANONICAL_SOURCE`, and this file follows automatically
because it's resolved relative to it.
