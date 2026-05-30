import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { createServer } from 'http';
import { exec } from 'child_process';
import { supabase } from '../db/connection.js';

const CALLBACK_PORT = 54321;

function openBrowser(url) {
  const cmd = process.platform === 'win32' ? `start "${url}"` : `open "${url}"`;
  exec(cmd);
}

async function startCallbackServer() {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${CALLBACK_PORT}`);
      const code = url.searchParams.get('code');

      // If no code in query params, serve a page that extracts it from the hash fragment
      if (!code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <body style="font-family:monospace;background:#000;color:#0f0;padding:40px">
              <h2>Completing auth...</h2>
              <script>
                const params = new URLSearchParams(window.location.hash.slice(1));
                const code = params.get('code') || new URLSearchParams(window.location.search).get('code');
                if (code) {
                  fetch('/?code=' + code).then(() => {
                    document.body.innerHTML = '<h2>Auth successful!</h2><p>You can close this tab.</p>';
                  });
                }
              </script>
            </body>
          </html>
        `);
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family:monospace;background:#000;color:#0f0;padding:40px">
            <h2>Auth successful!</h2>
            <p>You can close this tab and return to the terminal.</p>
          </body>
        </html>
      `);

      server.close();
      resolve(code);
    });

    server.on('error', reject);
    server.listen(CALLBACK_PORT);
  });
}

export default function Auth({ onAuth }) {
  const [status, setStatus] = useState('idle'); // idle | waiting | error
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) onAuth();
    });
  }, []);

  const handleLogin = async () => {
    setStatus('waiting');
    setError('');

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

      onAuth();
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  useEffect(() => {
    if (status === 'idle') handleLogin();
  }, []);

  if (status === 'waiting') {
    return (
      <Box flexDirection="column" paddingX={2} marginTop={2}>
        <Box borderStyle="double" borderColor="blue" paddingX={2} marginBottom={2}>
          <Text bold color="cyan">Study Terminal</Text>
        </Box>
        <Text bold color="white">Opening GitHub in your browser...</Text>
        <Box marginTop={1}>
          <Text color="gray">Waiting for authorization. Complete it in your browser to continue.</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="gray" dimColor>The browser should open automatically.</Text>
        </Box>
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box flexDirection="column" paddingX={2} marginTop={2}>
        <Box borderStyle="double" borderColor="red" paddingX={2} marginBottom={2}>
          <Text bold color="red">Auth Failed</Text>
        </Box>
        <Text color="red">{error}</Text>
        <Box marginTop={1}>
          <Text color="gray">Restart the app to try again.</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={2} marginTop={2}>
      <Box borderStyle="double" borderColor="blue" paddingX={2} marginBottom={2}>
        <Text bold color="cyan">Study Terminal</Text>
      </Box>
      <Text color="gray">Connecting...</Text>
    </Box>
  );
}
