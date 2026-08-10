# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

There is no code, no build, no test suite, no dependencies. The repo is **three prose files at
the root that are really one artifact in three renderings** (plus one standalone extra) — a prompt
that a user pastes into Claude Code at the root of their Obsidian vault, which then writes the whole
GTD system (schema, board, template, web-clipper template, and the `/gtd-triage`, `/gtd-review`,
`/gtd-update` skills) into that vault. See `README.md` for the user-facing pitch.

The work here is editing prompt text so that it stays internally consistent across all three files.

| File | Role |
|---|---|
| `install.md` | **Source of truth.** The installer prompt lives between the two `---` markers (line 21 → 383). Numbered sections: 1 `CLAUDE.md` schema · 2 `Templates/GTD Item.md` · 3 `GTD/Board.base` · 4 `GTD/Log.md` · 5 clipper JSON · 6 gtd-triage skill · 7 gtd-review skill · 8 gtd-update skill (**holds the migration changelog**) · 9 "Also create". |
| `update.md` | The migration prompt for already-installed vaults. Embeds the `/gtd-update` skill with a changelog that must be **identical** to `install.md` §8. |
| `import-notion.md` | **Outside the three-way sync, and deliberately not a skill.** Standalone paste-in prompt for bulk-loading a Notion / CSV export into an installed vault. Nothing fetches or embeds it, nothing version-stamps it — edit it freely, no mirroring, no changelog entry. It briefly shipped as a fetched `/gtd-import` skill in v5; that was withdrawn because `/gtd-update` only refreshes on a schema bump, so edits never reached vaults that had already installed it. Importing happens once per vault, which is the whole argument for a prompt over a skill. |
| `install.html` | Standalone single-page version. The entire installer prompt is a **JSON string** inside `<script type="application/json" id="prompt-data">`, injected into `#promptcode` at runtime. Not byte-identical to `install.md`: its tail folds the manual-setup steps into a final "One thing this prompt can't do for you" paragraph that `install.md` keeps as its own section. |

## Schema versioning — the core invariant

The generated vault `CLAUDE.md` carries a `**Schema version: N.**` marker (**currently 6**). A schema
change means appending a `### vN → vN+1` changelog entry, and that entry must land in **three places
kept identical**:

1. `install.md` §8 (inside the gtd-update SKILL.md code block)
2. `update.md`'s embedded `/gtd-update` skill
3. the `install.html` `#prompt-data` JSON mirror

Also bump the `Schema version:` marker in `install.md` §1, in the `install.html` JSON, and in §9's
final `[capture] Vault initialized (schema vN)` log line. `update.md`'s "Adding a future migration"
section restates this.

Check sync after any edit:

```sh
grep -n 'Schema version: [0-9]' install.md install.html
grep -c '^\s*### v' install.md update.md   # changelog entry counts must match
```

## Editing the install.html JSON blob

It is one giant single-line JSON string — the usual trap in this repo. Use targeted find/replace with
**exact escaping**: newlines are literal `\n`, quotes `\"`, indentation literal spaces, backticks
literal, and **em dashes are `—`** (searching for a literal `—` will not match). After any edit,
validate — a broken blob leaves the page showing "Loading…" forever:

```sh
python3 -c "
import json,re
m=re.search(r'<script type=\"application/json\" id=\"prompt-data\">(.*?)</script>', open('install.html').read(), re.S)
json.loads(m.group(1)); print('valid JSON')"
```

The reusable pattern is a patch script that replaces an old block only if it occurs exactly once,
then re-validates, aborting otherwise.

## Constraints the prompt text must preserve

- **Vault namespacing — no exceptions.** Everything the installer writes lives under `GTD/` plus
  `Templates/GTD Item.md`, `clipper/`, and `.claude/skills/`. Nothing in `.obsidian/`, ever, including
  during `/gtd-update`. (v5's `GTD/Attachments/` is not an exception — it's inside `GTD/`.) v3–v5 did
  carry one exception, `.obsidian/snippets/gtd-kanban.css`; **v6 removed it** — the `Base Board` plugin
  draws no property labels, so there is nothing left to hide with CSS. The v6 migration deliberately
  leaves the now-inert snippet on disk in already-installed vaults rather than deleting a user file.
- **Existing-vault safety.** Every generated file has a guard clause: append (`CLAUDE.md`, `README.md`)
  or stop and report the collision (`GTD/`, the skills, the clipper template). Never overwrite.
- **`status` is the only completion signal** (`inbox|focus|next|someday|waiting|done`). v2 deliberately
  removed the redundant `done:` boolean; don't reintroduce a second completion field.
- **`GTD/Board.base` kanban view's `order:` must list `file.name` and nothing else.** Since v6 the board
  is the `Base Board` plugin (`type: kanban`), which inverted the old rule: it never draws `file.name` as
  a chip but re-inserts it into `order:` on every render (rewriting the file if absent), and it renders
  tags as its own colored pills regardless of `order:` — so listing `tags` prints every tag twice. Two
  more v6 shapes that are easy to get wrong: `groupBy.property` is the **bare** `status` (not
  `note.status`), and `boardColumns` is a **flat list** (not a map keyed by property). The *table* views
  still need `file.name` in `order:`, and must stay `type: table` — a kanban view without a `groupBy` is
  what made pre-v6 boards write every note path into `columnOrders`.
- **`kanban_order` in item frontmatter belongs to the plugin.** `Base Board` writes it when cards are
  dragged within a column. The generated `CLAUDE.md` must tell the agent to preserve it untouched and
  not bump `updated` for it; it is not a second completion signal.
- **The Templater folder-template setting is the only remaining truly-manual step** — prompts must
  REPORT it to the user, never attempt it.

## Pushing changes is a live deploy

Installed vaults' `/gtd-update` skill ships with
`CANONICAL_SOURCE: https://raw.githubusercontent.com/cypiswhywhy/llm-gtd/main/update.md` and self-checks
it on every run, self-refreshing when it finds a newer changelog. **Pushing to `main` immediately changes
what every installed vault sees.** Unpushed migrations are invisible to users; half-pushed ones are live.
A local clone path (`~/devel/llm-gtd/update.md`) is the supported `CANONICAL_SOURCE` for offline use or
testing unpushed migrations.
