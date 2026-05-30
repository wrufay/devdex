import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const SESSION_DIR = join(homedir(), '.study-terminal');
const SESSION_FILE = join(SESSION_DIR, 'session.json');

const storage = {
  getItem(key) {
    try {
      const data = JSON.parse(readFileSync(SESSION_FILE, 'utf8'));
      return data[key] ?? null;
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    try {
      mkdirSync(SESSION_DIR, { recursive: true });
      let data = {};
      try { data = JSON.parse(readFileSync(SESSION_FILE, 'utf8')); } catch {}
      data[key] = value;
      writeFileSync(SESSION_FILE, JSON.stringify(data), 'utf8');
    } catch {}
  },
  removeItem(key) {
    try {
      let data = JSON.parse(readFileSync(SESSION_FILE, 'utf8'));
      delete data[key];
      writeFileSync(SESSION_FILE, JSON.stringify(data), 'utf8');
    } catch {}
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'pkce',
    storage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
