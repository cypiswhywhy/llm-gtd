# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

There is no product code, no build, no test suite, no dependencies (the one script,
`docs/demo/render.mjs`, only renders the README video). The repo is **three prose files at
the root that are really one artifact in three renderings** (plus one standalone extra) — a prompt
that a user pastes into Claude Code at the root of their Obsidian vault, which then writes the whole
GTD system (schema, board, template, web-clipper template, and the `/gtd-triage`, `/gtd-review`,
`/gtd-project`, `/gtd-update` skills) into that vault. See `README.md` for the user-facing pitch.

The work here is editing prompt text so that it stays internally consistent across all three files.

| File | Role |
|---|---|
| `install.md` | **Source of truth.** The installer prompt lives between the two `---` markers (line 23 → 690). Numbered sections: 1 `CLAUDE.md` schema · 2 `Templates/GTD Item.md` · 3 `GTD/Board.base` · 4 `GTD/Log.md` · 5 clipper JSON · 6 gtd-triage skill · 7 gtd-review skill · 8 gtd-update skill (**holds the migration changelog**) · 9 gtd-project skill · 10 "Also create". |
| `update.md` | The migration prompt for already-installed vaults. Embeds the `/gtd-update` skill with a changelog that must be **identical** to `install.md` §8, plus the **canonical text of every other skill** — gtd-triage, gtd-review, gtd-project — each byte-identical to its `install.md` section. Since v10 that is what lets a migration say "overwrite it verbatim" rather than describing an edit (see below). |
| `import-notion.md` | **Outside the three-way sync, and deliberately not a skill.** Standalone paste-in prompt for bulk-loading a Notion / CSV export into an installed vault. Nothing fetches or embeds it, nothing version-stamps it — edit it freely, no mirroring, no changelog entry. It briefly shipped as a fetched `/gtd-import` skill in v5; that was withdrawn because `/gtd-update` only refreshes on a schema bump, so edits never reached vaults that had already installed it. Importing happens once per vault, which is the whole argument for a prompt over a skill. |
| `install.html` | Standalone single-page version. The entire installer prompt is a **JSON string** inside `<script type="application/json" id="prompt-data">`, injected into `#promptcode` at runtime. Not byte-identical to `install.md`: its tail folds the manual-setup steps into a final "One thing this prompt can't do for you" paragraph that `install.md` keeps as its own section. |
| `docs/demo/` | **Outside the sync.** Source of the README demo: `demo.html` is a scripted animation (a mock of Obsidian + Claude Code, not a recording), `render.mjs` screenshots it frame by frame in headless Chrome and writes `docs/assets/demo.mp4` + `demo.gif` (needs `google-chrome`, `ffmpeg`, Node 22). Run `node docs/demo/render.mjs`; `--stills 5,30` previews single frames. The terminal dialogue paraphrases what the skills do — re-render if a skill's user-visible flow changes. |

## Schema versioning — the core invariant

The generated vault `CLAUDE.md` carries a `**Schema version: N.**` marker (**currently 11**). A schema
change means appending a `### vN → vN+1` changelog entry, and that entry must land in **three places
kept identical**:

1. `install.md` §8 (inside the gtd-update SKILL.md code block)
2. `update.md`'s embedded `/gtd-update` skill
3. the `install.html` `#prompt-data` JSON mirror

Also bump the `Schema version:` marker in `install.md` §1, in the `install.html` JSON, and in §10's
final `[capture] Vault initialized (schema vN)` log line. `update.md`'s "Adding a future migration"
section restates this.

A migration that touches a **skill file at all** — adding one or editing one — needs one thing more.
Print the skill once per rendering: its own numbered section in `install.md`, its own
`## The /<name> skill` section inside `update.md`'s prompt, the mirror in `install.html`. Then have
the changelog entry say *overwrite `.claude/skills/<name>/SKILL.md` verbatim from that section*,
rather than repeating the text a fourth time or describing the edit in prose.

**Never describe a skill edit in prose** (v10). The agent applying it writes its own wording, the next
migration edits that paraphrase, and after a few rounds a vault's skill and the repo's are different
documents with no way to tell a rewording from a lost rule. v9 is the worked example of the mistake
and v10 of the repair; v4 and v8 were the precedents. The consequence is deliberate and spelled out in
those entries: since an installed `/gtd-update` carries only the changelog, such a migration can only
be applied when the canonical source was actually read, and refuses rather than writing half of
itself offline.

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
  v8 went one step further and retired v3's *creation* step as well, so a vault migrating through v3
  today is told to skip it: **no migration path writes outside `GTD/` any more.**
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
- **`kanban_order` in item frontmatter is write-once, then the plugin's.** `Base Board` ignores a
  kanban view's `sort:` entirely (it reads only `boardColumns`, `collapsedColumns`, `tagColors`,
  `cardOpenBehavior`, `columnColors`, `wipLimits`, `cardCoverProperty`, `newCardsToTop`,
  `cardTitleProperty`) and orders cards by `kanban_order` alone — numbers ascending, then strings,
  then unset; ties fall back to file ctime *ascending*. v7 exploits that: every capture path stamps
  minus the creation timestamp in ms, so columns read newest-first. The `+` button overwrites that
  value with its own, which is why the kanban view carries `newCardsToTop: true`. After creation the
  field is the plugin's: the first in-column drag rewrites that whole column into fractional-index
  string keys. The generated `CLAUDE.md` must say stamp-on-create, never re-stamp, never bump
  `updated` for it; it is not a second completion signal. Upstream declined a sort-by-property option
  ([issue #38](https://github.com/mderazon/obsidian-base-board/issues/38)) — don't re-litigate it.
- **Projects are not items and never become cards.** A project is a note in `GTD/Projects/` holding
  the plan as a markdown checklist; the board's filter is `file.inFolder("GTD/Items")`, so projects
  are excluded by construction — do not add a project view, a `type:` discriminator, or a filter to
  `Board.base` to compensate. Only the **active step** of a project exists as an item (`status: next`,
  carrying `project: "[[Project]]"`), at most `wip` of them at a time (default 1). That one-card limit
  is the entire point of the feature, not a conservative default to relax later. Three shapes are easy
  to get wrong: a checklist line is **never deleted** (finished → `- [x]` + `✅ date`, abandoned →
  struck through with a reason), the item wikilinks are **name-only** so `/gtd-review` archiving an
  item doesn't break them, and a done project **stays in `GTD/Projects/`** — `GTD/Archive/` is for
  items. Project notes carry `wip`/`outcome` and never a `kanban_order`.
- **Project movement is derived, never stored** (v9). A project's last-moved date is computed at review
  time from three dates already on disk — the newest `✅ YYYY-MM-DD` in its checklist, the `updated` of
  its live step item(s), and its own `created` — and `/gtd-review`'s check 1 flags 14 days of silence
  (30 for a project already at `status: waiting`). Don't add a `last_moved` field: a stamp that some
  paths forget to write is worse than no stamp. The check proposes **one** exit per stalled project,
  never all four, and never promotes a step itself — promotion belongs to `/gtd-project`.
- **The Templater folder-template setting is the only remaining truly-manual step** — prompts must
  REPORT it to the user, never attempt it.

## Pushing changes is a live deploy

Installed vaults' `/gtd-update` skill ships with
`CANONICAL_SOURCE: https://raw.githubusercontent.com/cypiswhywhy/llm-gtd/main/update.md` and self-checks
it on every run, self-refreshing when it finds a newer changelog. **Pushing to `main` immediately changes
what every installed vault sees.** Unpushed migrations are invisible to users; half-pushed ones are live.
A local clone path (`~/devel/llm-gtd/update.md`) is the supported `CANONICAL_SOURCE` for offline use or
testing unpushed migrations.
