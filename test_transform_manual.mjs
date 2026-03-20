import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://iwbljdkmabwwcuzmmzhg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmxqZGttYWJ3d2N1em1temhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzI4ODMsImV4cCI6MjA4ODEwODg4M30.8pt5SasAi0tlrSGFtJ-KSR09PFw-BH6dP3NCRM8gs94');

async function testTransformations() {
    const tenantId = '2cdefd9e-5286-4014-9978-94d8a4bf01e5';
    
    const [
        usersRes,
        booksRes,
        invPhysRes,
        invDigRes,
        invoicesRes,
        royaltiesRes,
        auditRes,
        commentsRes,
        alertsRes,
        docsRes,
        salesRes,
        consignmentsRes,
        quotesRes,
        suppliersRes,
        poRes,
        expensesRes
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
        supabase.from('documents').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
        supabase.from('sales').select('*, books(title)').eq('tenant_id', tenantId).order('sale_date', { ascending: false }),
        supabase.from('consignments').select('*, books(title)').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
        supabase.from('quotes').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
        supabase.from('suppliers').select('*').eq('tenant_id', tenantId).order('name', { ascending: true }),
        supabase.from('purchase_orders').select('*, books(title), suppliers(name)').eq('tenant_id', tenantId).order('date_ordered', { ascending: false }),
        supabase.from('expenses').select('*, suppliers(name)').eq('tenant_id', tenantId).order('date', { ascending: false })
    ]);

    const books = booksRes.data || [];
    const transformedBooks = books.map(b => ({
      id: b.id,
      title: b.title,
      escandalloCosts: b.escandallo_costs || { edicion: 0, correccion: 0, maquetacion: 0, diseno: 0, impresion: 0, marketing: 0, distribucion: 0, otros: 0 },
    }));

    const sales = salesRes.data || [];
    const transformedSales = sales.map(s => ({
      id: s.id,
      books: s.books,
      bookTitle: s.books?.title || ''
    }));

    const po = poRes.data || [];
    const transformedPO = po.map(p => ({
      id: p.id,
      books: p.books,
      suppliers: p.suppliers,
      bookTitle: p.books?.title || 'Libro Desconocido'
    }));

    const data = {
      books: transformedBooks,
      sales: transformedSales,
      purchaseOrders: transformedPO
    };

    console.log('Successfully transformed sample data.');
    console.log('Books:', data.books.length);
    console.log('Sales sample book structure:', data.sales[0]?.books);
    console.log('PO sample book structure:', data.purchaseOrders[0]?.books);
}
testTransformations();
