import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://iwbljdkmabwwcuzmmzhg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmxqZGttYWJ3d2N1em1temhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzI4ODMsImV4cCI6MjA4ODEwODg4M30.8pt5SasAi0tlrSGFtJ-KSR09PFw-BH6dP3NCRM8gs94');

async function test() {
    const tenantId = 't_master';
    const [
        { data: users, error: usersErr },
        { data: books, error: booksErr },
        { data: invPhysical, error: invPhysErr },
        { data: invDigital, error: invDigErr },
        { data: invoices, error: invoicesErr },
        { data: royalties, error: royaltiesErr },
        { data: auditLog, error: auditErr },
        { data: comments, error: commentsErr },
        { data: alerts, error: alertsErr },
        { data: documents, error: docsErr }
    ] = await Promise.all([
        supabase.from('users').select('*').eq('tenant_id', tenantId),
        supabase.from('books').select('*').eq('tenant_id', tenantId),
        supabase.from('inventory_physical').select('*').eq('tenant_id', tenantId),
        supabase.from('inventory_digital').select('*').eq('tenant_id', tenantId),
        supabase.from('invoices').select('*').eq('tenant_id', tenantId).order('date', { ascending: false }),
        supabase.from('royalties').select('*').eq('tenant_id', tenantId),
        supabase.from('audit_log').select('*').eq('tenant_id', tenantId).order('date', { ascending: false }),
        supabase.from('comments').select('*').eq('tenant_id', tenantId).order('date', { ascending: true }),
        supabase.from('alerts').select('*').eq('tenant_id', tenantId).order('date', { ascending: false }),
        supabase.from('documents').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false })
    ]);

    const errors = [usersErr, booksErr, invPhysErr, invDigErr, invoicesErr, royaltiesErr, auditErr, commentsErr, alertsErr, docsErr].filter(Boolean);
    if (errors.length > 0) {
        console.error('Errors:', errors);
    } else {
        console.log('No SQL errors.');
    }
}
test();
