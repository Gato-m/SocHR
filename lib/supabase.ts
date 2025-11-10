import { createClient } from '@supabase/supabase-js';

// Configure these via your environment (app.json / app.config.js or runtime secrets)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Keep this a console warning rather than throwing so the app can still start in dev.
  // The developer should provide these values in their environment before fetching data.
  // Example: SUPABASE_URL and SUPABASE_ANON_KEY in process.env or use Expo secrets.
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase URL or ANON KEY not provided. Set SUPABASE_URL and SUPABASE_ANON_KEY in env.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
