import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://iwbljdkmabwwcuzmmzhg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmxqZGttYWJ3d2N1em1temhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzI4ODMsImV4cCI6MjA4ODEwODg4M30.8pt5SasAi0tlrSGFtJ-KSR09PFw-BH6dP3NCRM8gs94');

async function testJoins() {
    console.log('Testing Sales Join...');
    const { data: sales, error: sErr } = await supabase.from('sales').select('*, books(title)').limit(1);
    console.log('Sales result:', sErr ? sErr.message : 'OK');

    console.log('Testing Consignments Join...');
    const { data: cons, error: cErr } = await supabase.from('consignments').select('*, books(title)').limit(1);
    console.log('Consignments result:', cErr ? cErr.message : 'OK');

    console.log('Testing PO Join...');
    const { data: po, error: poErr } = await supabase.from('purchase_orders').select('*, books(title), suppliers(name)').limit(1);
    console.log('PO result:', poErr ? poErr.message : 'OK');

    console.log('Testing Expenses Join...');
    const { data: exp, error: eErr } = await supabase.from('expenses').select('*, suppliers(name)').limit(1);
    console.log('Expenses result:', eErr ? eErr.message : 'OK');
}
testJoins();
