---
name: pocket-import
description: Review every note in a vault folder together with the user and move the ones worth keeping into Pocket, leaving the rest where they are. Use when the user runs /gtd:pocket-import <folder>, or asks to bring an existing folder of articles, clippings or reading notes into Pocket.
---

# Pocket import — review a folder, keep what's worth keeping

`/gtd:pocket-import <folder>` goes through the notes in a folder the human names, recommends for
each one whether it belongs in Pocket, and moves only the ones the human confirms. Everything else
stays where it was, untouched. Follow the schema and the rules in the vault's `CLAUDE.md` — the
`## Pocket` section and the propose-then-apply rule.

This is the one operation that touches notes outside `GTD/` and `Pocket/`, and only because the
human named the folder. It never goes beyond that folder, and the only thing it ever does there is
move a confirmed note out of it.

## Steps

1. **Check the folder.** No argument → ask for one. It must exist and must not be, or lie inside,
   `GTD/`, `Pocket/`, `Templates/`, `clipper/`, `.claude/` or `.obsidian/` — otherwise say why and
   stop. List the markdown notes in it; other files (images, PDFs) are never moved. If it has
   subfolders, say how many notes each holds and ask whether to include them. No notes → say so
   and stop.
2. **Build the Pocket vocabulary** exactly as `/gtd:pocket` does: every `category` and `tags` value
   in `Pocket/Notes/`, plus the entries under `boardColumns:` in `Pocket/Board.base` (read it, never
   write it).
3. **Review in batches of 20**, oldest first. Read each note's frontmatter and body (fetch its
   `source` URL only when the body is empty) and recommend one of:
   - **→ Pocket** — something the human could want again: content with lasting value (an article,
     a clipping, a recipe, a reference, research), or an option worth having next time (a place, a
     product, a contractor). Propose a category and tags from the Pocket vocabulary, per the `## Pocket` section.
   - **leave** — anything else: personal notes, journals, meeting notes, drafts, tasks, notes that
     belong to another system, content that has gone stale.
   - **?** — when the note itself can't decide it; give the one question that would.

   Also flag a note that another note links to **by path** (`[[<folder>/<name>`): moving it breaks
   that link. Links by name alone survive the move.
4. **Propose the batch** as one table: `#` (rule 9 in `CLAUDE.md`), note, recommendation, category,
   tags, a one-line reason — and say how many batches remain. Wait. The human's answer decides, not
   the recommendation.
5. **Apply the confirmed → Pocket rows only.** For each:
   - `mv` it to `Pocket/Notes/`, keeping the name. A note of that name already there → don't
     overwrite; propose a distinguishing name.
   - Set the Pocket keys: `category` and `tags` as confirmed (tags the note already had are shown in
     the proposal and kept only where confirmed); `created` kept if present, else taken from an
     existing date key such as `date`, else the file-creation date; `source` kept if present, else
     taken from an existing `url` or `link` key, else empty; `updated` today; `kanban_order` minus
     the move time in milliseconds.
   - Every other key the note arrived with stays exactly as it was — except `status`, which a
     Pocket note never carries: show it in the proposal and drop it.
   - The body is not touched and the note is not renamed.

   Then go on to the next batch. The human may stop at any batch; running the command again picks
   up whatever is still in the folder.
6. **Log** one line per moved note in `GTD/Log.md`: `YYYY-MM-DD HH:MM [pocket] "<title>" <folder> →
   Pocket/<category> (tags: ...)`, and at the end one line `YYYY-MM-DD HH:MM [pocket] import
   <folder>: N moved, M left`.
7. **Report** how many notes went to each category and how many stayed. Name any new category: its
   column appears at the right-hand end of the Pocket board.

## Guard clauses

- **Leaving means untouched.** A note that stays gets no new key, no tag and no `updated` bump.
- **Never delete, never copy.** A confirmed note moves; nothing else happens in the folder.
- Never move a file that isn't a markdown note, and never read or move anything outside the named
  folder (and its subfolders, if the human included them).
- Never touch `Pocket/Board.base`, `GTD/Board.base` or `.obsidian/`.
