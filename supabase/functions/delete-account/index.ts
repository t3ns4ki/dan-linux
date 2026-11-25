import { createClient } from 'npm:@supabase/supabase-js@2.119.2';
import { createDeleteHandler } from './handler.mjs';
import { deleteWithShareCleanup } from './cleanup.mjs';

const url = Deno.env.get('SUPABASE_URL');
const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const origins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://t3ns4ki.github.io,https://dan-open-source-linux.largedace4.chatgpt.site').split(',').map(value => value.trim()).filter(Boolean);
if (!url || !secret || !origins.length) throw new Error('Server environment is incomplete');
const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

Deno.serve(createDeleteHandler({
  allowedOrigins: origins,
  getUser: async (token: string) => {
    const { data, error } = await admin.auth.getUser(token);
    if (error) throw new Error('Unauthorized');
    return data.user;
  },
  deleteUser: async (id: string) => {
    await deleteWithShareCleanup(admin, id);
  }
}));
