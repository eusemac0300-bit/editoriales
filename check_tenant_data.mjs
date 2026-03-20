import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://iwbljdkmabwwcuzmmzhg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmxqZGttYWJ3d2N1em1temhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzI4ODMsImV4cCI6MjA4ODEwODg4M30.8pt5SasAi0tlrSGFtJ-KSR09PFw-BH6dP3NCRM8gs94');

async function checkTenantData() {
    const tenantId = '2cdefd9e-5286-4014-9978-94d8a4bf01e5';
    const { count: booksCount } = await supabase.from('books').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId);
    console.log(`Books for tenant ${tenantId}: ${booksCount}`);
}
checkTenantData();
