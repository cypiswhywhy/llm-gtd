---
name: triage
description: Process the GTD inbox in batches of 10 — enrich, tag, and route items to kanban columns. Use when the user wants to clear or triage their inbox, or asks "what's in my inbox".
---

# GTD inbox triage

Process every item with `status: inbox` in `GTD/Items/`, at most 10 at a time, so no proposal is a wall of decisions. Follow the schema and rules in the vault's `CLAUDE.md`.

## Steps

1. **Collect.** Read frontmatter of all notes in `GTD/Items/`; select those with `status: inbox`, oldest `created` first. Some hand-made notes may lack `created` or `source` — for ordering, treat a missing `created` as the note's file-creation date. If none: say the inbox is empty and stop. Otherwise the first 10 are this batch — or as many as the user asked for (`/gtd:triage 20`); the rest wait for the next one. Steps 2–7 handle one batch.

2. **Build the tag vocabulary.** Gather all `tags` used across `GTD/Items/` and `GTD/Archive/` so suggestions reuse existing tags. Rebuild it for every batch, so a tag added in one batch is reused in the next.

3. **Enrich each item in the batch:**
   - If `source` has a URL and the body is empty or just a raw clip: fetch the URL and write a 2–4 sentence summary into the body, in the human's own voice (rule 8 in `CLAUDE.md`); keep any existing user text above it and put the summary under a `## Summary` heading. If the fetch fails, note that and move on — never block the batch.
   - Suggest tags from the vocabulary (new tag only if nothing fits). A row proposed `→ Pocket` takes its category and tags from the Pocket vocabulary instead (every `category` and `tags` value in `Pocket/Notes/`).
   - Propose a destination status using GTD clarification rules:
     - actionable and quick (~2 min) → suggest the user just does it now; otherwise `next`
     - actionable but the user is actively on it → `focus` (warn if Focus would exceed 5 items)
     - blocked on someone/something else → `waiting`
     - "maybe someday", no commitment → `someday`
     - pure reference with no action (e.g. an interesting read already skimmed) → propose `done` after distilling the useful part into the body, or keeping it as `someday` reading; if it is worth keeping for good, propose `→ Pocket` with a category and Pocket tags instead (the `## Pocket` section of `CLAUDE.md`)
   - If the title isn't action-oriented, propose a rename: a short verb phrase, worded the way the human would write it on their own list (rule 8 in `CLAUDE.md`).

4. **Propose the batch.** Open with where the user is — `Batch 2 of 12 · items 11–20 of 117`. Then present one table: `#` (rule 9 in `CLAUDE.md`), item, proposed status, proposed tags, rename (if any), one-line rationale — one item per row, so every item has its own number. Ask the user to confirm all / pick exceptions by number. Numbering restarts at #1 in every batch.

5. **Apply confirmed changes only.** A confirmed `→ Pocket` row is moved exactly as the `## Pocket` section of `CLAUDE.md` describes and skips the rest of this step. For every other row: update frontmatter (`status`, `tags`), rename files via `mv` when approved, bump `updated` to today, keep `created` untouched. Also backfill schema gaps on every processed item: if `created` is missing, set it to the note's file-creation date (fall back to today); if the `source` key is absent, add an empty `source:`; if `kanban_order` is absent, set it to minus the note's file-creation time in milliseconds (an item with no sort key sinks to the bottom of its column). Never change a `kanban_order` that is already there, whatever its value. This heals hand-made notes that bypassed the template.

6. **Log.** Append one line per processed item to `GTD/Log.md`: `YYYY-MM-DD HH:MM [triage] "<title>" → <status> (tags: ...)`, or `YYYY-MM-DD HH:MM [pocket] "<title>" → Pocket/<category> (tags: ...)` for a row moved to Pocket.

7. **Next batch.** If inbox items remain, say how many and ask whether to go on. On yes, go back to step 2 with the next batch. Anything else ends the run; the remaining items stay in the inbox for the next `/gtd:triage`. Every finished batch is already applied and logged, so stopping loses nothing.

8. **Report.** Summarize what moved where across all batches, how many items are still in the inbox, and anything the user should decide later.
