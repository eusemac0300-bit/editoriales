import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://iwbljdkmabwwcuzmmzhg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmxqZGttYWJ3d2N1em1temhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzI4ODMsImV4cCI6MjA4ODEwODg4M30.8pt5SasAi0tlrSGFtJ-KSR09PFw-BH6dP3NCRM8gs94');

async function testLoadAllData() {
    const tenantId = '2cdefd9e-5286-4014-9978-94d8a4bf01e5';
    console.time('Total loadAllData');
    
    try {
        const results = await Promise.all([
            supabase.from('users').select('*').eq('tenant_id', tenantId),
            supabase.from('books').select('*').eq('tenant_id', tenantId),
            supabase.from('inventory_physical').select('*').eq('tenant_id', tenantId),
            supabase.from('inventory_digital').select('*').eq('tenant_id', tenantId),
            supabase.from('invoices').select('*').eq('tenant_id', tenantId).order('date', { ascending: false }),
            supabase.from('royalties').select('*').eq('tenant_id', tenantId),
            supabase.from('audit_log').select('*').eq('tenant_id', tenantId).order('date', { ascending: false }),
            supabase.from('comments').select('*').eq('tenant_id', tenantId).order('date', { ascending: true }),
            supabase.from('alerts').select('*').eq('tenant_id', tenantId).order('date', { ascending: false }),
            supabase.from('documents').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
            supabase.from('sales').select('*, books(title)').eq('tenant_id', tenantId).order('sale_date', { ascending: false }),
            supabase.from('consignments').select('*, books(title)').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
            supabase.from('quotes').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
            supabase.from('suppliers').select('*').eq('tenant_id', tenantId).order('name', { ascending: true }),
            supabase.from('purchase_orders').select('*, books(title), suppliers(name)').eq('tenant_id', tenantId).order('date_ordered', { ascending: false }),
            supabase.from('expenses').select('*, suppliers(name)').eq('tenant_id', tenantId).order('date', { ascending: false })
        ]);

        const tableNames = ['users', 'books', 'inv_physical', 'inv_digital', 'invoices', 'royalties', 'audit_log', 'comments', 'alerts', 'documents', 'sales', 'consignments', 'quotes', 'suppliers', 'purchase_orders', 'expenses'];
        
        results.forEach((res, i) => {
            if (res.error) {
                console.error(`❌ ${tableNames[i]}: ERROR -`, res.error.message);
            } else {
                console.log(`✅ ${tableNames[i]}: ${res.data?.length || 0} rows`);
            }
        });
    } catch (err) {
        console.error('FATAL ERROR:', err);
    }
    
    console.timeEnd('Total loadAllData');
}
testLoadAllData();
