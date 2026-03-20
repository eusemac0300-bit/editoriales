import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://iwbljdkmabwwcuzmmzhg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmxqZGttYWJ3d2N1em1temhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzI4ODMsImV4cCI6MjA4ODEwODg4M30.8pt5SasAi0tlrSGFtJ-KSR09PFw-BH6dP3NCRM8gs94');

async function checkAllCounts() {
    const tenantId = '2cdefd9e-5286-4014-9978-94d8a4bf01e5';
    const tables = [
        'users', 'books', 'inventory_physical', 'inventory_digital', 
        'invoices', 'royalties', 'audit_log', 'comments', 
        'alerts', 'documents', 'sales', 'consignments', 
        'quotes', 'suppliers', 'purchase_orders', 'expenses'
    ];
    
    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId);
        if (error) console.error(`Error on ${table}:`, error.message);
        else console.log(`${table}: ${count}`);
    }
}
checkAllCounts();
