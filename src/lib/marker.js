// Decorate a blessed list so the selected row wears a ꕤ marker that follows the
// cursor (unselected rows are padded so nothing shifts). Keeps the list's normal
// keys + handlers intact — just set your rows through the returned setItems(),
// and the marker repaints automatically as the cursor moves.
const MARKER = "ꕤ ";
const PAD = " ".repeat(MARKER.length);

export function attachMarker(screen, list) {
  let base = []; // plain labels, without the marker

  function repaint() {
    const sel = Math.max(0, list.selected || 0);
    list.setItems(base.map((l, i) => (i === sel ? MARKER : PAD) + l));
    list.select(sel);
    screen.render();
  }

  function setItems(labels) {
    base = labels;
    list.select(0);
    repaint();
  }

  // The list's built-in navigation fires on 'keypress', which blessed emits
  // BEFORE the specific 'key <name>' event — so by the time these run, the
  // selection has already moved and we just redraw the marker on the new row.
  for (const k of ["up", "down", "k", "j", "home", "end", "pageup", "pagedown"]) {
    list.key([k], repaint);
  }

  return { setItems, repaint };
}
