import blessed from "neo-blessed";
import { createServer } from "http";
import { exec } from "child_process";
import { supabase } from "../db/connection.js";

const CALLBACK_PORT = 54321;

function openBrowser(url) {
  const cmd = process.platform === "win32" ? `start "${url}"` : `open "${url}"`;
  exec(cmd);
}

// Barebones styling for the browser callback pages: white background, black text.
const PAGE_CSS = `
  body {
    margin: 0; min-height: 100vh; padding: 40px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; text-align: center;
    background: #fff; color: #000;
    font-family: sans-serif;
  }
`;

function htmlPage(inner) {
  return `<!DOCTYPE html><html lang="en"><head>
    <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <title>devDex</title>
    <style>${PAGE_CSS}</style>
  </head><body>${inner}</body></html>`;
}

const SUCCESS_INNER =
  "<h1>you're in!</h1>" +
  "<p>head back to your terminal + you can close this tab</p>";

function startCallbackServer() {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${CALLBACK_PORT}`);
      const code = url.searchParams.get("code");

      if (!code) {
        // The OAuth code may arrive in the URL fragment; bounce it back as a query.
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(
          htmlPage(
            "<h1>signing you in...</h1>" +
              `<script>
                const code = new URLSearchParams(location.search).get('code')
                  || new URLSearchParams(location.hash.slice(1)).get('code');
                if (code) fetch('/?code=' + code).then(() => {
                  document.body.innerHTML = ${JSON.stringify(SUCCESS_INNER)};
                });
              </script>`
          )
        );
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(htmlPage(SUCCESS_INNER));
      server.close();
      resolve(code);
    });

    server.on("error", reject);
    server.listen(CALLBACK_PORT);
  });
}

export async function renderAuth(screen, navigate) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) {
    navigate("menu");
    return;
  }

  const idleContent =
    "\n{center}{cyan-fg}{bold}welcome to devDex 𓏵‧₊˚ ┊{/bold}{/cyan-fg}{/center}\n\n" +
    "{center}spaced repetition flashcards, in your terminal{/center}\n\n" +
    "{center}{gray-fg}press Enter to sign in with GitHub{/gray-fg}{/center}";

  const box = blessed.box({
    top: "center",
    left: "center",
    width: "60%",
    height: 14,
    border: { type: "line" },
    style: { border: { fg: "cyan" } },
    tags: true,
    keys: true,
    content: idleContent,
  });

  screen.append(box);
  box.focus();
  screen.render();

  // Wait for the user to opt in before launching the browser. Auto-starting
  // here would instantly re-authenticate right after logout, since GitHub
  // silently redirects back once the OAuth app is already authorized.
  let started = false;
  box.key(["enter", "space"], async () => {
    if (started) return;
    started = true;

    box.setContent(
      "\n{center}{cyan-fg}{bold}devDex 𓏵‧₊˚ ┊{/bold}{/cyan-fg}{/center}\n\n\n" +
        "{center}{white-fg}opening GitHub in your browser...{/white-fg}{/center}\n\n" +
        "{center}{gray-fg}finish signing in, then come back here{/gray-fg}{/center}"
    );
    screen.render();

    try {
      const codePromise = startCallbackServer();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `http://localhost:${CALLBACK_PORT}`,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      openBrowser(data.url);

      const code = await codePromise;
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;

      navigate("menu");
    } catch (err) {
      box.setContent(
        `\n{center}{red-fg}{bold}sign-in failed{/bold}{/red-fg}{/center}\n\n` +
          `{center}{red-fg}${err.message}{/red-fg}{/center}\n\n` +
          `{center}{gray-fg}press any key to try again{/gray-fg}{/center}`
      );
      screen.render();
      screen.once("keypress", () => navigate("auth"));
    }
  });
}
