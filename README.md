# llm-gtd

An Obsidian-based GTD system that an LLM maintains for you.

Following the [llm-wiki idea](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f):
**you capture and decide, the LLM does the bookkeeping.** You drop thoughts and web clips
into an inbox; Claude Code enriches them, tags them, routes them onto a kanban board, and
runs the weekly lint pass.

This repo isn't a plugin or a package — it's a set of **prompts**. You paste one into Claude
Code at your vault's root and it builds (or migrates) the whole system in place.

## Files

| File | What it's for |
|---|---|
| [`install.md`](install.md) | The installer prompt. Sets up a fresh vault — schema, board, template, web-clipper template, and the `/gtd-triage`, `/gtd-review`, `/gtd-update` skills. Safe on vaults that already have notes. |
| [`update.md`](update.md) | The migration prompt. Brings an already-installed vault up to the current schema version, non-destructively. Also the canonical home of the migration changelog. |
| [`import-notion.md`](import-notion.md) | The import prompt. Bulk-loads an existing system — a Notion **Markdown & CSV** export, or a plain CSV — onto the board. Paste-in only: importing happens once per vault, so there's no skill to install. |
| [`install.html`](install.html) | A polished single-page version of `install.md` — pitch, setup steps, and a copy-button prompt block. Open it in a browser, or paste it into an Artifact for a shareable link. |

## Getting started

1. Create (or open) an Obsidian vault.
2. In Obsidian: Settings → Community plugins → install and enable `Dataview`, `Templater`,
   `Obsidian Kanban`, `Base Board`, `Obsidian Tasks Plugin`, `Icon Folder`.
3. Open a terminal at the vault's root, run `claude`, and paste in the prompt from
   [`install.md`](install.md) (everything between the two `---` markers).
4. Finish the one manual step it reports: Settings → Templater → "Trigger Templater on new
   file creation", plus a Folder Template mapping `GTD/Items` → `Templates/GTD Item.md`.

Day to day: `/gtd-triage` clears the inbox, `/gtd-review` is the weekly lint pass,
`/gtd-update` pulls in schema changes.

## Coming from Notion

Export your workspace as **Markdown & CSV** (all rows, everything), then **drop the zip into a
`.gtd-import/` folder at your vault's root** — no need to unzip. The leading dot keeps Obsidian
from indexing it, so the export can sit inside the vault without polluting search or the board.
Then paste in the prompt from [`import-notion.md`](import-notion.md).

There's no `/gtd-import` skill on purpose. Importing is a once-per-vault job, so a pasted prompt
is always current, needs no install step, and can't go stale the way an installed copy does.

You can skip even that: the import checks `.gtd-import/`, the vault root, `~/Downloads/`, and the
vault's parent before it asks you for a path, so leaving the zip in Downloads usually works.

It surveys the export, proposes how your Notion statuses and tags map onto the six GTD columns,
and writes only once you confirm. Long-finished items go straight to `GTD/Archive/` so the board
opens clean. If your vault is a git repo, `.gtd-import/` belongs in `.gitignore` — the import
offers to add it.

## What it creates in your vault

```
CLAUDE.md               # the schema — the contract between you and the agent
GTD/Board.base          # kanban board + Inbox / Stale / All items views
GTD/Items/              # one note per item — the only place items live
GTD/Archive/            # old done items
GTD/Attachments/        # files an import brought with it (on demand)
GTD/Log.md              # append-only activity log
Templates/GTD Item.md   # Templater template for new items
clipper/                # Obsidian Web Clipper template
.claude/skills/         # gtd-triage, gtd-review, gtd-update
```

Nothing else in the vault is read, moved, retagged, or modified — the prompts are explicit
about that, and they stop and ask rather than overwrite anything that already exists.

## Schema versioning

The generated `CLAUDE.md` carries a `Schema version: N` marker (currently **v6**). When the
schema changes, a `### vN → vN+1` entry is appended to the changelog in `update.md` and
mirrored in `install.md` §8 and the `install.html` prompt blob — those three must stay in sync.

Installed vaults don't go stale: the `/gtd-update` skill ships with `CANONICAL_SOURCE`
pointing at this repo's raw `update.md`, checks it on every run, and refreshes itself when it
finds a newer changelog. Point it at a local clone instead if you want unpushed migrations to
count.

## History

This started inside a personal scripts repo as `scripts/obsidian-llm-gtd/` and was extracted
here with its git history intact.
