# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

There is no product code, no build, no test suite, no dependencies (the one script,
`docs/demo/render.mjs`, only renders the README video). The repo is a **Claude Code plugin
marketplace with one plugin, `gtd`**. Installed into an Obsidian vault with `--scope project`, its
`/gtd:install` skill writes the GTD system (schema, board, template, web-clipper template, the
separate Pocket board) into that vault, and its other skills — `/gtd:triage`, `/gtd:review`,
`/gtd:project`, `/gtd:pocket`, `/gtd:pocket-import`, `/gtd:update` — run the system from there. See
`README.md` for the user-facing pitch.

The work here is editing prompt text. Every text lives in exactly one file — there is nothing to
mirror any more.

| Path | Role |
|---|---|
| `.claude-plugin/marketplace.json` | The marketplace. Users install with `claude plugin install gtd --marketplace cypiswhywhy/llm-gtd --scope project`. |
| `plugins/gtd/.claude-plugin/plugin.json` | The plugin manifest. Its `version` is the release switch (see "Releasing" below). |
| `plugins/gtd/skills/<name>/SKILL.md` | The skills, one file each. The vault holds no copy, so editing one needs no migration. |
| `plugins/gtd/vault/` | **Every file `/gtd:install` copies, byte for byte**: `CLAUDE.md` (the vault schema; appended if the vault has one), `README.md` (appended likewise), both `Board.base`, `GTD/Log.md`, both templates, both clipper JSONs. Change a file here and you change new installs; existing vaults need a migration. |
| `update.md` | **Frozen at v15.** The migration prompt for vaults installed before the plugin (v1–v14), still fetched by their old in-vault `/gtd-update` from `main`. Its last entry, v14 → v15, installs the plugin and deletes the in-vault skills. It keeps the canonical text of the old skills (v15 checks them for local additions before deleting) and its own snapshot of the v15 `CLAUDE.md` and `README.md` — never let it fetch from `plugins/gtd/vault/`, which later versions change. Don't edit it except to fix a bug in the path to v15. |
| `install.md`, `install.html` | Short install instructions, as markdown and as a web page. `install.html`'s copy button copies the JSON string in `#prompt-data` — the two install commands. |
| `import-notion.md` | **Deliberately not a skill.** Standalone paste-in prompt for bulk-loading a Notion / CSV export into an installed vault — edit it freely, no changelog entry. It briefly shipped as a fetched `/gtd-import` skill in v5; that was withdrawn because skills then only refreshed on a schema bump. Plugin skills don't have that problem any more, but importing still happens once per vault, which is the argument for a prompt over a skill. |
| `fix-native-kanban.md` | **Same reasoning as `import-notion.md`.** Opt-in paste-in prompt for Obsidian 1.14+, whose native Bases kanban registered the same view type `kanban` as `Base Board` and took over the boards. Patches the vault's copy of the plugin to register `base-board` and switches only views with Base Board keys. Temporary: once upstream [issue #62](https://github.com/mderazon/obsidian-base-board/issues/62) ships, the real fix is a schema migration moving the boards to upstream's new type, and this file goes. |
| `docs/demo/` | Source of the README demo: `demo.html` is a scripted animation (a mock of Obsidian + Claude Code, not a recording), `render.mjs` screenshots it frame by frame in headless Chrome and writes `docs/assets/demo.mp4` + `demo.gif` (needs `google-chrome`, `ffmpeg`, Node 22). Run `node docs/demo/render.mjs`; `--stills 5,30` previews single frames. The terminal dialogue paraphrases what the skills do — re-render if a skill's user-visible flow changes. |

Two notes on the vault files that live nowhere else: the Templater template and the clipper both
stamp `kanban_order` as minus the creation time in ms (`-1 * Number(tp.date.now("x"))`,
`{{date|date:"x"|calc:"*-1"}}`), and the clipper's property type must be `number` — as text it sorts
as a string and falls below every real number.

## Schema versioning — the core invariant

The vault `CLAUDE.md` carries a `**Schema version: N.**` marker (**currently 15**). Changing anything
in `plugins/gtd/vault/` that an existing vault already has is a schema change:

1. Append a `### vN → vN+1` entry to the changelog in `plugins/gtd/skills/update/SKILL.md`.
2. Bump the marker in `plugins/gtd/vault/CLAUDE.md` and the `(schema vN)` log line in
   `plugins/gtd/skills/install/SKILL.md`.
3. Bump `version` in `plugin.json`, or the change never reaches anyone.

A migration that changes a vault file takes the new text **verbatim from the plugin** — the update
skill copies it from `${CLAUDE_PLUGIN_ROOT}/vault/`. **Never describe a file edit in prose** (v10):
the agent applying it writes its own wording, the next migration edits that paraphrase, and after a
few rounds a vault's file and the repo's are different documents with no way to tell a rewording from
a lost rule. v9 is the worked example of the mistake and v10 of the repair. Before v15 this rule was
about skills; now skills ship with the plugin and need no migration at all.

Check after any edit:

```sh
claude plugin validate . && claude plugin validate ./plugins/gtd
grep -n 'Schema version: [0-9]' plugins/gtd/vault/CLAUDE.md
grep -n 'schema v[0-9]' plugins/gtd/skills/install/SKILL.md
```

Test an install on an empty folder with the local plugin: `claude --plugin-dir ./plugins/gtd`, then
`/gtd:install`, then `diff -r plugins/gtd/vault <vault>` — only the log line and the placeholder item
may differ.

## Constraints the prompt text must preserve

- **Vault namespacing — no exceptions.** Everything the installer writes lives under `GTD/` and
  `Pocket/` (v13) plus `Templates/GTD Item.md`, `Templates/Pocket Note.md` and `clipper/`. Since v15
  not even `.claude/skills/`: the skills live in the plugin, and the vault's `.claude/settings.json` is
  written by `claude plugin install`, not by us. Nothing in `.obsidian/`, ever, including
  during `/gtd:update`. (v5's `GTD/Attachments/` is not an exception — it's inside `GTD/`.) v3–v5 did
  carry one exception, `.obsidian/snippets/gtd-kanban.css`; **v6 removed it** — the `Base Board` plugin
  draws no property labels, so there is nothing left to hide with CSS. The v6 migration deliberately
  leaves the now-inert snippet on disk in already-installed vaults rather than deleting a user file.
  v8 went one step further and retired v3's *creation* step as well, so a vault migrating through v3
  today is told to skip it: **no migration path writes outside those paths any more.** The single
  exception is user-invoked, not installed behaviour: `/gtd:pocket-import <folder>` (v13) reads the folder
  the user names and moves the notes they confirm out of it into `Pocket/Notes/` — nothing else there.
  `fix-native-kanban.md` is the other user-invoked one: it edits
  `.obsidian/plugins/base-board/main.js` (backup first), and only when pasted in.
- **Existing-vault safety.** Every generated file has a guard clause: append (`CLAUDE.md`, `README.md`)
  or stop and report the collision (`GTD/`, `Pocket/`, the templates, the clipper templates). Never overwrite.
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
  struck through with a reason), the item wikilinks are **name-only** so `/gtd:review` archiving an
  item doesn't break them, and a done project **stays in `GTD/Projects/`** — `GTD/Archive/` is for
  items. Project notes carry `wip`/`outcome` and never a `kanban_order`.
- **Project movement is derived, never stored** (v9). A project's last-moved date is computed at review
  time from three dates already on disk — the newest `✅ YYYY-MM-DD` in its checklist, the `updated` of
  its live step item(s), and its own `created` — and `/gtd:review`'s check 1 flags 14 days of silence
  (30 for a project already at `status: waiting`). Don't add a `last_moved` field: a stamp that some
  paths forget to write is worse than no stamp. The check proposes **one** exit per stalled project,
  never all four, and never promotes a step itself — promotion belongs to `/gtd:project`.
- **Pocket is independent of GTD, and going there is a move** (v13). `Pocket/Notes/` has its own
  frontmatter (`category` + `tags`, **no `status`**), its own board and its own tag vocabulary — never
  merge the two vocabularies or add a `status` to Pocket. Only a `done` item moves, by `mv` (never a
  copy), with a fresh `kanban_order`; nothing moves back. The Pocket board's columns are `category`
  values: `boardColumns` lists `""` (the plugin's `(No value)` column = unsorted pile) plus four
  starters, and `Base Board` appends a column for any other value it finds (`getColumns()` in its
  `main.js`), so a new category never needs a `Pocket/Board.base` edit. `/gtd:pocket`'s sweep proposes only done
  items the user could want again — lasting content, or the runners-up of a decision that recurs (holiday
  places not chosen) — never every done item: being done is not a reason to keep something.
- **The Templater folder-template setting is the only remaining truly-manual step** — prompts must
  REPORT it to the user, never attempt it.

## Releasing

A pushed commit reaches **nobody** until `version` in `plugins/gtd/.claude-plugin/plugin.json` changes:
the field pins every installed copy to that version. Bump it to release; users get it on their next
plugin update. That makes half-finished work on `main` safe — except in `update.md`, which old
in-vault `/gtd-update` skills still fetch from `main` on every run, so a push there is live at once.
