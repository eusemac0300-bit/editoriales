import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://iwbljdkmabwwcuzmmzhg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmxqZGttYWJ3d2N1em1temhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzI4ODMsImV4cCI6MjA4ODEwODg4M30.8pt5SasAi0tlrSGFtJ-KSR09PFw-BH6dP3NCRM8gs94');

async function testLoginFlow() {
    console.time('Supabase Auth signInWithPassword');
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'trial@editorial.cl',
        password: 'trial123'
    });
    console.timeEnd('Supabase Auth signInWithPassword');
    console.log('Auth error:', authErr?.message || 'none');
    console.log('Auth data:', authData?.user?.email || 'null');

    console.time('Custom users table query');
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'trial@editorial.cl')
        .eq('password', 'trial123')
        .single();
    console.timeEnd('Custom users table query');
    console.log('User found:', data?.email || 'null');
    console.log('User error:', error?.message || 'none');
}
testLoginFlow();
