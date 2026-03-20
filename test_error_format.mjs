import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://iwbljdkmabwwcuzmmzhg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmxqZGttYWJ3d2N1em1temhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzI4ODMsImV4cCI6MjA4ODEwODg4M30.8pt5SasAi0tlrSGFtJ-KSR09PFw-BH6dP3NCRM8gs94');

async function testError() {
    const { data, error } = await supabase.from('inventory_digital').select('*').eq('tenant_id', 'test');
    console.log('Error object:', JSON.stringify(error, null, 2));
    console.log('Error code:', error?.code);
    console.log('Error message:', error?.message);
    console.log('Does message include "does not exist"?', error?.message?.includes('does not exist'));
    console.log('Does message include "schema cache"?', error?.message?.includes('schema cache'));
}
testError();
