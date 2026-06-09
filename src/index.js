#!/usr/bin/env node
import blessed from "neo-blessed";
import { createNavigate } from "./app.js";

export const screen = blessed.screen({
  smartCSR: true,
  title: "devDex",
  fullUnicode: true,
});

screen.key(["C-c"], () => {
  screen.destroy();
  process.exit(0);
});

screen.on("resize", () => screen.render());

process.on("uncaughtException", (err) => {
  try {
    screen.destroy();
  } catch (_) {}
  process.stderr.write(`\nuncaughtException: ${err.stack || err}\n`);
  process.exit(1);
});

const navigate = createNavigate(screen);
navigate("auth");
