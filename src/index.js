#!/usr/bin/env node
import 'dotenv/config';
import React from 'react';
import { render } from 'ink';
import App from './app.js';

const { waitUntilExit } = render(React.createElement(App));
waitUntilExit().then(() => process.exit(0));
