# Fixing the board after Obsidian 1.14

Obsidian 1.14 added its own kanban view to Bases and gave it the same internal name, `kanban`, that
the `Base Board` plugin uses. A `.base` file picks its view by that name, so since 1.14 Obsidian
draws `GTD/Board.base` and `Pocket/Board.base` with its **native** kanban instead of `Base Board`.
You'll notice:

- tags gone from cards, or shown without their colors;
- columns can no longer be collapsed;
- Obsidian quietly edits the board file (adds a `groupOrder:` list, puts `tags` into `order:`).

The real fix is the plugin renaming its view — requested upstream in
[mderazon/obsidian-base-board#62](https://github.com/mderazon/obsidian-base-board/issues/62). Until
that ships, the prompt below patches your local copy of the plugin to register as `base-board`
and points both boards at it. Paste it into Claude Code at the vault's root.

**Good to know before you run it:**

- It edits one file outside `GTD/` and `Pocket/`: `.obsidian/plugins/base-board/main.js`, after
  backing it up next to itself as `main.js.orig`. That is the only time anything from llm-gtd
  touches `.obsidian/`, and only because you asked for it.
- **A `Base Board` update undoes the patch.** If the board goes back to the native look after an
  update, paste this prompt again. If the update already contains the upstream fix, the prompt
  notices, skips the patch, and only switches your boards to the plugin's new name.
- To undo: restore `main.js.orig` over `main.js` and set both boards' `type:` back to `kanban`.

---

You are fixing an llm-gtd vault whose `Base Board` boards are being drawn by Obsidian 1.14's native
kanban view, because both register the Bases view type `kanban`. Work from the vault root. Show me
what you found and what you will change, and wait for my yes before writing anything.

1. **Check the vault.** `CLAUDE.md` must contain an llm-gtd `Schema version:` marker, and
   `.obsidian/plugins/base-board/main.js` must exist. If either is missing, stop and tell me — this
   fix is only for llm-gtd vaults using `Base Board`.

2. **Find the plugin's view type.** In `main.js`, find the `registerBasesView("<id>", {` call and
   read `<id>`. Call it `ID`.
   - If `ID` is `kanban`, the plugin still collides — go to step 3.
   - If `ID` is anything else, upstream (or an earlier run of this prompt) already renamed it. Skip
     step 3 and use that `ID` in step 4.

3. **Patch the plugin.** Copy `main.js` to `main.js.orig` in the same folder (skip the copy if
   `main.js.orig` already exists — never overwrite an earlier backup). Then make exactly these
   replacements in `main.js`, each of which must match exactly once; if any matches zero or more
   than one time, restore from `main.js.orig`, stop, and show me what you found instead:
   - `this.type = "kanban";` → `this.type = "base-board";`
   - `this.registerBasesView("kanban", {` → `this.registerBasesView("base-board", {`
   - the `name: "Kanban",` line directly after it → `name: "Base Board",`
   - `` `  - type: kanban`, `` → `` `  - type: base-board`, `` (the template the plugin's
     "Create new board" command writes)

   Set `ID` to `base-board`. Change nothing else in the file.

4. **Point the boards at the plugin.** For each of `GTD/Board.base` and `Pocket/Board.base` that
   exists, look at every entry under `views:`. A view is a `Base Board` view if it has
   `type: kanban` **and** any of these keys: `boardColumns`, `collapsedColumns`, `tagColors`,
   `newCardsToTop`, `columnColors`, `wipLimits`. Leave every other view alone — a `type: kanban`
   view without those keys may be a native board you made on purpose, and table views are never
   touched. In each `Base Board` view:
   - change `type: kanban` to `type: <ID>`;
   - delete a `groupOrder:` block if present (native-view setting; column order lives in
     `boardColumns`);
   - make `order:` list `file.name` and nothing else — `Base Board` draws tags as colored pills on
     its own, so a `tags` entry prints every tag twice;
   - keep everything else as it is, including `boardColumns`, `collapsedColumns`, `tagColors`,
     `newCardsToTop`, `groupBy`, `filters`, and the view's `name`.

   Never touch `kanban_order` in any note — card order is stored there and is unaffected.

5. **Report**, in a few lines: whether the plugin was patched or already renamed (and `ID`), which
   views in which files you changed, and this next step for me:
   **Restart Obsidian** (or turn `Base Board` off and on in Settings → Community plugins), then
   open the GTD board. Tags should have their colors back and columns should collapse again.

---
