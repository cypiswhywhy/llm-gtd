<%*
/*
  Folder template for Pocket/Notes/. Templater runs it on every note with no
  body that appears there: a new empty note, a card from the board's + button,
  a note moved in from GTD. It merges what this prints into the note's own
  frontmatter, and its values win, so print only the keys the note lacks: a
  card added to a category column keeps it, a moved note keeps its dates and
  kanban_order.
*/
const info = tp.obsidian.getFrontMatterInfo(tp.file.content);
const parsed = info.exists ? tp.obsidian.parseYaml(info.frontmatter) : null;
const fm = parsed && typeof parsed === "object" ? parsed : {};
const empty = (key) => fm[key] == null || fm[key] === "";
const today = tp.date.now("YYYY-MM-DD");
const lines = [];
if (!("category" in fm)) lines.push("category:");
if (!("tags" in fm)) lines.push("tags: []");
if (empty("created")) lines.push(`created: ${today}`);
if (empty("updated")) lines.push(`updated: ${today}`);
if (!("source" in fm)) lines.push("source:");
if (empty("kanban_order")) lines.push(`kanban_order: ${-1 * Number(tp.date.now("x"))}`);
if (lines.length > 0) tR += `---\n${lines.join("\n")}\n---\n`;
-%>
