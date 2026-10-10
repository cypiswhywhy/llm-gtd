---
name: pocket
description: Keep content in Pocket — move done GTD items worth keeping into Pocket/Notes/ with a category and tags, and file Pocket's unsorted notes. Use when the user wants to keep, save or shelve an article or note they've finished with, move something to Pocket, or sort their Pocket.
---

# Pocket — keep what's worth keeping

GTD holds things to do; Pocket holds things to keep. This skill moves finished GTD items into
`Pocket/Notes/` and files Pocket notes into categories. Follow the schema and the rules in the
vault's `CLAUDE.md` — in particular the `## Pocket` section, which defines a Pocket note and exactly
how an item moves — and the propose-then-apply rule.

## Modes

- **`/gtd:pocket <item names or a description>`** — move those items. Look them up in `GTD/Items/`
  and `GTD/Archive/`; if a description matches more than one, list the matches and ask.
- **`/gtd:pocket`** with no argument — a sweep of two groups:
  1. **Unsorted** — every note in `Pocket/Notes/` with an empty or missing `category`.
  2. **Candidates** — `status: done` items in `GTD/Items/` that look worth keeping, and only those.
     Being done is not a reason to keep something, and neither is a `source` URL on its own. The
     question for each item is whether the human could want it again. Propose it when:
     - its content has lasting value — an article, a recipe, research findings, a reference; or
     - it is an option collected for a decision that can come up again — a holiday place, a
       restaurant, a product, a contractor. Choosing one doesn't make the others worthless: the
       runners-up are the next shortlist. List such items under one heading per decision (still
       one numbered row each), so the human can take all, some or none of them in one answer.

     A finished chore, a call, a payment, or a link to a one-off form stays out. Every candidate
     carries a one-line reason. Items not proposed stay in GTD, and `/gtd:review` archives them as
     usual.

## Steps

1. **Build the Pocket vocabulary.** Every `category` value used across `Pocket/Notes/`, plus the
   entries under `boardColumns:` in `Pocket/Board.base` (read it, never write it); every `tags` value
   used across `Pocket/Notes/`. GTD tags are not part of it.
2. **Collect** the notes for the mode. Nothing to do → say so and stop.
3. **Read each note**, frontmatter and body. If the body is empty and `source` is a URL, fetch it so
   the category and tags describe the actual content; if the fetch fails, say so and carry on.
4. **Propose one table**: `#` (rule 9 in `CLAUDE.md`), note, where it is now, category, tags, rename
   (if any), and for a sweep candidate the reason it is worth keeping — one note per row. Mark a category or tag that doesn't exist yet as **new**, and an item
   that isn't `done` as **marks it done first**.
   - **Category:** exactly one. Reuse an existing one; propose a new one only when none fits, named
     in the same language and style as the existing ones.
   - **Tags:** one to four from the Pocket vocabulary; a new tag only when nothing fits.
   - **Rename:** only when the title names a task rather than the content, and only when no note in
     the vault links to it by name (search for `[[<name>]]` and `[[<name>|`). Word it per rule 8.
5. **Apply confirmed rows only.**
   - **A GTD item** moves exactly as the `## Pocket` section of `CLAUDE.md` describes: `mv` it to
     `Pocket/Notes/` (under the confirmed new name, if any), rewrite its frontmatter to the Pocket
     shape, `updated` today, `kanban_order` stamped fresh with minus the move time in milliseconds.
   - **An unsorted Pocket note:** set `category` and `tags`, bump `updated`, and backfill gaps — a
     missing `created` becomes the file-creation date, a missing `source` key an empty `source:`, a
     missing `kanban_order` minus the file-creation time in milliseconds. Never change a
     `kanban_order` that is already there.
6. **Log** one line per note in `GTD/Log.md`: `YYYY-MM-DD HH:MM [pocket] "<title>" GTD/Items →
   Pocket/<category> (tags: ...)` for a move, `YYYY-MM-DD HH:MM [pocket] "<title>" filed →
   <category> (tags: ...)` for a Pocket note.
7. **Report** what moved where. Name any new category: its column appears at the right-hand end of
   the Pocket board, and the human can drag it into place.

## Guard clauses

- **Never delete, never copy.** An item moves into Pocket; nothing is left behind in GTD, and no
  Pocket note is ever removed.
- **Never move a live project step** — an item with `project:` set that isn't `done`. A done step
  may move, but is never renamed: its project's checklist links to it by name.
- If a note of the same name already exists in `Pocket/Notes/`, don't overwrite it — propose a
  distinguishing name.
- A GTD tag reaches a Pocket note only when the same tag is already in the Pocket vocabulary.
- Never touch `Pocket/Board.base`, `GTD/Board.base`, `.obsidian/`, or any note outside `GTD/` and
  `Pocket/`.
