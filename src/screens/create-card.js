import blessed from "neo-blessed";
import { createCard, updateCard } from "../db/queries.js";

// Doubles as the create and edit form: pass a `card` to edit it, omit to create.
export function renderCreate(screen, navigate, { deck, card }) {
  const back = () => navigate("deck", { deck });

  const box = blessed.box({
    top: "center",
    left: "center",
    width: "60%",
    height: 16,
    border: { type: "line" },
    style: { border: { fg: "cyan" } },
    tags: true,
    label: card ? ` edit card in ${deck.name} ` : ` new card in ${deck.name} `,
  });

  blessed.text({ parent: box, top: 1, left: 2, content: "front:" });
  const frontInput = blessed.textbox({
    parent: box,
    top: 2,
    left: 2,
    right: 2,
    height: 3,
    border: { type: "line" },
    inputOnFocus: true,
    style: { border: { fg: "gray" }, focus: { border: { fg: "cyan" } } },
  });

  blessed.text({ parent: box, top: 6, left: 2, content: "back:" });
  const backInput = blessed.textbox({
    parent: box,
    top: 7,
    left: 2,
    right: 2,
    height: 3,
    border: { type: "line" },
    inputOnFocus: true,
    style: { border: { fg: "gray" }, focus: { border: { fg: "cyan" } } },
  });

  const status = blessed.text({
    parent: box,
    bottom: 1,
    left: 2,
    right: 2,
    tags: true,
    content: "{gray-fg}Enter to move between fields · Esc to cancel{/gray-fg}",
  });

  screen.append(box);

  // Prefill must happen after append — setValue resolves width via the parent
  // chain, which only exists once the box is attached to the screen.
  if (card) {
    frontInput.setValue(card.front);
    backInput.setValue(card.back);
  }

  async function save() {
    const front = frontInput.getValue().trim();
    const backText = backInput.getValue().trim();
    if (!front || !backText) {
      status.setContent("{red-fg}both front and back are required.{/red-fg}");
      screen.render();
      frontInput.focus();
      return;
    }
    status.setContent("{gray-fg}saving...{/gray-fg}");
    screen.render();
    try {
      if (card) await updateCard(card.id, front, backText);
      else await createCard(deck.id, front, backText);
      back();
    } catch (err) {
      status.setContent(`{red-fg}${err.message}{/red-fg}`);
      screen.render();
      frontInput.focus();
    }
  }

  // Field navigation.
  frontInput.key(["escape"], back);
  backInput.key(["escape"], back);
  frontInput.on("submit", () => backInput.focus());
  backInput.on("submit", save);

  frontInput.focus();
  screen.render();
}
