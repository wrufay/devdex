import blessed from "neo-blessed";
import { createServer } from "http";
import { exec } from "child_process";
import { supabase } from "../db/connection.js";

const CALLBACK_PORT = 54321;

function openBrowser(url) {
  const cmd = process.platform === "win32" ? `start "${url}"` : `open "${url}"`;
  exec(cmd);
}

function startCallbackServer() {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${CALLBACK_PORT}`);
      const code = url.searchParams.get("code");

      if (!code) {
        // The OAuth code may arrive in the URL fragment; bounce it back as a query.
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`<html><body style="font-family:monospace;background:#000;color:#0f0;padding:40px">
          <h2>Completing auth...</h2>
          <script>
            const code = new URLSearchParams(window.location.search).get('code')
              || new URLSearchParams(window.location.hash.slice(1)).get('code');
            if (code) fetch('/?code=' + code).then(() => {
              document.body.innerHTML = '<h2>Done! Return to terminal.</h2>';
            });
          </script></body></html>`);
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`<html><body style="font-family:monospace;background:#000;color:#0f0;padding:40px">
        <h2>Auth successful!</h2><p>You can close this tab.</p></body></html>`);
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
    "\n{center}{cyan-fg}{bold}✧ fay wu ✧{/bold}{/cyan-fg}{/center}\n\n" +
    "{center}hi there! welcome to {bold}cli_cards{/bold} ♡{/center}\n\n" +
    "{center}{blue-fg}✧{/blue-fg} spaced repetition, in your terminal{/center}\n" +
    "{center}{blue-fg}✧{/blue-fg} github login, saved to the cloud{/center}\n" +
    "{center}{blue-fg}✧{/blue-fg} flip cards, grow your brain △{/center}\n\n" +
    "{center}{gray-fg}press enter to sign in with github →{/gray-fg}{/center}";

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
      "\n{center}{cyan-fg}{bold}✧ fay wu ✧{/bold}{/cyan-fg}{/center}\n\n\n" +
        "{center}{white-fg}opening github in your browser...{/white-fg}{/center}\n\n" +
        "{center}{gray-fg}finish signing in over there, then come back ♡{/gray-fg}{/center}"
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
        `\n{center}{red-fg}{bold}hmm, sign-in didn't work{/bold}{/red-fg}{/center}\n\n` +
          `{center}{red-fg}${err.message}{/red-fg}{/center}\n\n` +
          `{center}{gray-fg}press any key to try again{/gray-fg}{/center}`
      );
      screen.render();
      screen.once("keypress", () => navigate("auth"));
    }
  });
}
