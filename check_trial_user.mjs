import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://iwbljdkmabwwcuzmmzhg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmxqZGttYWJ3d2N1em1temhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzI4ODMsImV4cCI6MjA4ODEwODg4M30.8pt5SasAi0tlrSGFtJ-KSR09PFw-BH6dP3NCRM8gs94');

async function checkUser() {
    const { data: user, error } = await supabase.from('users').select('*').eq('email', 'trial@editorial.cl').single();
    if (error) {
        console.error('Error finding user:', error);
    } else {
        console.log('User found:', user);
    }
}
checkUser();
