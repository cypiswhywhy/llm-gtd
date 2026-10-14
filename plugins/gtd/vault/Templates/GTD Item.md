<%*
/*
  Folder template for GTD/Items/. Templater runs it on every note with no body
  that appears there: a new empty note, a card from the board's + button, a
  note renamed or moved in from outside Obsidian. It merges what this prints
  into the note's own frontmatter, and its values win, so print only the keys
  the note lacks: a card added to the next column stays next, a renamed item
  keeps its status, dates and kanban_order.
*/
const info = tp.obsidian.getFrontMatterInfo(tp.file.content);
const parsed = info.exists ? tp.obsidian.parseYaml(info.frontmatter) : null;
const fm = parsed && typeof parsed === "object" ? parsed : {};
const empty = (key) => fm[key] == null || fm[key] === "";
const today = tp.date.now("YYYY-MM-DD");
const lines = [];
if (empty("status")) lines.push("status: inbox");
if (!("tags" in fm)) lines.push("tags: []");
if (empty("created")) lines.push(`created: ${today}`);
if (empty("updated")) lines.push(`updated: ${today}`);
if (!("source" in fm)) lines.push("source:");
if (empty("kanban_order")) lines.push(`kanban_order: ${-1 * Number(tp.date.now("x"))}`);
if (lines.length > 0) tR += `---\n${lines.join("\n")}\n---\n`;
-%>
