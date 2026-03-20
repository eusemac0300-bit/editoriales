import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://iwbljdkmabwwcuzmmzhg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmxqZGttYWJ3d2N1em1temhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzI4ODMsImV4cCI6MjA4ODEwODg4M30.8pt5SasAi0tlrSGFtJ-KSR09PFw-BH6dP3NCRM8gs94');

async function checkUserVariants() {
    const { data: users, error } = await supabase.from('users').select('email, tenant_id').ilike('email', '%trail%');
    console.log('Trail-like users:', users);
}
checkUserVariants();
