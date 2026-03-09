import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iwbljdkmabwwcuzmmzhg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmxqZGttYWJ3d2N1em1temhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzI4ODMsImV4cCI6MjA4ODEwODg4M30.8pt5SasAi0tlrSGFtJ-KSR09PFw-BH6dP3NCRM8gs94';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data: cols, error: currErr } = await supabase.from('quotes').select('approved_amount').limit(1);
    console.log('approved_amount:', cols, currErr);

    // Check what the actual columns are
    const { data, error } = await supabase.from('quotes').select('*').limit(1);
    // filter keys:
    if (data && data.length > 0) {
        console.log('keys:', Object.keys(data[0]).filter(k => k.includes('approved') || k.includes('amount')));
    }
}

test();
