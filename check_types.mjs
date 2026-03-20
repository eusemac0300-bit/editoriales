import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://iwbljdkmabwwcuzmmzhg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmxqZGttYWJ3d2N1em1temhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzI4ODMsImV4cCI6MjA4ODEwODg4M30.8pt5SasAi0tlrSGFtJ-KSR09PFw-BH6dP3NCRM8gs94');

async function checkColumnType() {
    const { data, error } = await supabase.rpc('get_column_detailed', { t_name: 'purchase_orders', c_name: 'tenant_id' });
    // Or just run a query and check if a non-UUID works.
    const { error: uuidErr } = await supabase.from('purchase_orders').select('*').eq('tenant_id', 'not-a-uuid');
    console.log('Error with non-UUID on purchase_orders.tenant_id:', uuidErr ? uuidErr.message : 'No error (likely TEXT)');
    
    const { error: uuidErr2 } = await supabase.from('books').select('*').eq('tenant_id', 'not-a-uuid');
    console.log('Error with non-UUID on books.tenant_id:', uuidErr2 ? uuidErr2.message : 'No error (likely TEXT)');
}
checkColumnType();
