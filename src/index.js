#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { initSchema } from './db/schema.js';
import { closeDb } from './db/connection.js';
import App from './app.js';

// Initialize database
initSchema();

// Render the app
const { waitUntilExit } = render(React.createElement(App));

waitUntilExit().then(() => {
  closeDb();
  process.exit(0);
});
