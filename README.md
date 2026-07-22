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
| [`install.html`](install.html) | A polished single-page version of `install.md` — pitch, setup steps, and a copy-button prompt block. Open it in a browser, or paste it into an Artifact for a shareable link. |

## Getting started

1. Create (or open) an Obsidian vault.
2. In Obsidian: Settings → Community plugins → install and enable `Dataview`, `Templater`,
   `Obsidian Kanban`, `kanban-bases-view`, `Obsidian Tasks Plugin`, `Icon Folder`.
3. Open a terminal at the vault's root, run `claude`, and paste in the prompt from
   [`install.md`](install.md) (everything between the two `---` markers).
4. Finish the one manual step it reports: Settings → Templater → "Trigger Templater on new
   file creation", plus a Folder Template mapping `GTD/Items` → `Templates/GTD Item.md`.

Day to day: `/gtd-triage` clears the inbox, `/gtd-review` is the weekly lint pass,
`/gtd-update` pulls in schema changes.

## What it creates in your vault

```
CLAUDE.md               # the schema — the contract between you and the agent
GTD/Board.base          # kanban board + Inbox / Stale / All items views
GTD/Items/              # one note per item — the only place items live
GTD/Archive/            # old done items
GTD/Log.md              # append-only activity log
Templates/GTD Item.md   # Templater template for new items
clipper/                # Obsidian Web Clipper template
.claude/skills/         # gtd-triage, gtd-review, gtd-update
.obsidian/snippets/gtd-kanban.css   # the one file written outside GTD/
```

Nothing else in the vault is read, moved, retagged, or modified — the prompts are explicit
about that, and they stop and ask rather than overwrite anything that already exists.

## Schema versioning

The generated `CLAUDE.md` carries a `Schema version: N` marker (currently **v4**). When the
schema changes, a `### vN → vN+1` entry is appended to the changelog in `update.md` and
mirrored in `install.md` §8 and the `install.html` prompt blob — those three must stay in sync.

Installed vaults don't go stale: the `/gtd-update` skill ships with `CANONICAL_SOURCE`
pointing at this repo's raw `update.md`, checks it on every run, and refreshes itself when it
finds a newer changelog. Point it at a local clone instead if you want unpushed migrations to
count.

## History

This started inside a personal scripts repo as `scripts/obsidian-llm-gtd/` and was extracted
here with its git history intact.
