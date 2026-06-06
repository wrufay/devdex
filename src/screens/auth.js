import blessed from 'neo-blessed';
import { createServer } from 'http';
import { exec } from 'child_process';
import { supabase } from '../db/connection.js';

const CALLBACK_PORT = 54321;

function openBrowser(url) {
  const cmd = process.platform === 'win32' ? `start "${url}"` : `open "${url}"`;
  exec(cmd);
}

function startCallbackServer() {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${CALLBACK_PORT}`);
      const code = url.searchParams.get('code');

      if (!code) {
        // The OAuth code may arrive in the URL fragment; bounce it back as a query.
        res.writeHead(200, { 'Content-Type': 'text/html' });
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

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<html><body style="font-family:monospace;background:#000;color:#0f0;padding:40px">
        <h2>Auth successful!</h2><p>You can close this tab.</p></body></html>`);
      server.close();
      resolve(code);
    });

    server.on('error', reject);
    server.listen(CALLBACK_PORT);
  });
}

export async function renderAuth(screen, navigate) {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) { navigate('menu'); return; }

  const box = blessed.box({
    top: 'center', left: 'center', width: '60%', height: 10,
    border: { type: 'double' },
    style: { border: { fg: 'blue' } },
    tags: true,
    keys: true,
    content: '{cyan-fg}{bold}Flashcards{/bold}{/cyan-fg}\n\n{white-fg}Press Enter to sign in with GitHub.{/white-fg}\n\n{gray-fg}Ctrl-C to quit.{/gray-fg}',
  });

  screen.append(box);
  box.focus();
  screen.render();

  // Wait for the user to opt in before launching the browser. Auto-starting
  // here would instantly re-authenticate right after logout, since GitHub
  // silently redirects back once the OAuth app is already authorized.
  let started = false;
  box.key(['enter', 'space'], async () => {
    if (started) return;
    started = true;

    box.setContent('{cyan-fg}{bold}Flashcards{/bold}{/cyan-fg}\n\n{white-fg}Opening GitHub in your browser...{/white-fg}\n\n{gray-fg}Waiting for authorization. Complete it in your browser.{/gray-fg}');
    screen.render();

    try {
      const codePromise = startCallbackServer();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `http://localhost:${CALLBACK_PORT}`,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      openBrowser(data.url);

      const code = await codePromise;
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;

      navigate('menu');
    } catch (err) {
      box.setContent(
        `{red-fg}{bold}Auth Failed{/bold}{/red-fg}\n\n{red-fg}${err.message}{/red-fg}\n\n{gray-fg}Press any key to retry.{/gray-fg}`
      );
      screen.render();
      screen.once('keypress', () => navigate('auth'));
    }
  });
}
