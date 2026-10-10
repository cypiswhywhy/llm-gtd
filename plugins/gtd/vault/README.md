## LLM-GTD

A GTD board and a Pocket board, kept by Claude Code. You capture and decide; Claude does the bookkeeping. The rules live in `CLAUDE.md`.

**Capture.** Make a new note in `GTD/Items/`, or clip a page with the Obsidian Web Clipper after importing `clipper/gtd-clipper-template.json`. New notes fill in their frontmatter through the Templater folder template.

**The board.** Open `GTD/Board.base`. It has four views: Board, Inbox, Stale and All items. The `Base Board` plugin draws it.

- Each column shows the newest item first. Every note is created with a `kanban_order` sort key, so the Bases "Sort" setting does nothing on a board.
- Dragging a card to another column changes its `status`.
- Dragging within a column replaces that column's `kanban_order` values with the order you dropped the cards in.

**Pocket.** `Pocket/Board.base` is a separate board for content worth keeping once its task is done, one column per category. `clipper/pocket-clipper-template.json` clips straight into it.

**Commands** (from the `gtd` Claude Code plugin):

- `/gtd:triage` — go through the inbox.
- `/gtd:review` — the weekly review: stalled projects, stale items, archiving.
- `/gtd:project` — break a big outcome into a `GTD/Projects/` note and keep only its next step on the board. With no argument it advances every project that has room.
- `/gtd:pocket` — move a done item to Pocket with a category and tags. With no argument it files Pocket's unsorted notes and suggests done items to keep.
- `/gtd:pocket-import <folder>` — go through an existing folder of notes together and move the ones worth keeping into Pocket.
- `/gtd:update` — bring the vault up to date after a schema change.

Moving in from Notion or a CSV is a one-off job: paste the repo's `import-notion.md` prompt into Claude Code.
