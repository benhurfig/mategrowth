import { handleRequest } from './handler.mjs';
// Same Supabase secret and sender as SmartimateApp. No browser key required.
Deno.serve((request: Request) => handleRequest(request, {RESEND_API_KEY:Deno.env.get('RESEND_API_KEY')}));
