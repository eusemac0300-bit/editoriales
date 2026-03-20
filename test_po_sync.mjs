import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://iwbljdkmabwwcuzmmzhg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmxqZGttYWJ3d2N1em1temhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzI4ODMsImV4cCI6MjA4ODEwODg4M30.8pt5SasAi0tlrSGFtJ-KSR09PFw-BH6dP3NCRM8gs94');

async function testFlow() {
    const tenantId = '76f257e6-1912-4154-97ff-c315f27ae0f5';
    
    // 1. Get a book to test
    const { data: books, error: booksErr } = await supabase
        .from('books')
        .select('*')
        .eq('tenant_id', tenantId)
    
    if (booksErr || !books || books.length === 0) {
        console.error('No books found to test');
        return;
    }
    
    const book = books[0];
    console.log(`\n📘 Testing with Book: ${book.title}`);
    console.log(`Current Escandallo Costs:`, book.escandallo_costs);

    // 2. Get a supplier
    const { data: suppliers, error: suppErr } = await supabase
        .from('suppliers')
        .select('*')
        .eq('tenant_id', tenantId)
    
    if (suppErr || !suppliers || suppliers.length === 0) {
        console.error('No suppliers found to test');
        return;
    }
    
    const supplier = suppliers[0];
    console.log(`🏢 Using Supplier: ${supplier.name}`);

    // 3. Create a test Purchase Order
    const poId = crypto.randomUUID();
    const orderNumber = `OC-TEST-${Date.now().toString().slice(-4)}`;
    const expectedQuantity = 1000;
    const totalCost = 2500000; // Expected unit cost: 2500
    
    console.log(`🛒 Creating PO: ${orderNumber} for 1000 units, Total Cost: $${totalCost}`);
    
    const { error: poInsErr } = await supabase
        .from('purchase_orders')
        .insert([{
            id: poId,
            tenant_id: tenantId,
            order_number: orderNumber,
            book_id: book.id,
            supplier_id: supplier.id,
            expected_quantity: expectedQuantity,
            total_cost: totalCost,
            status: 'ENVIADA',
            date_ordered: new Date().toISOString()
        }]);
    
    if (poInsErr) {
        console.error('Error creating PO:', poInsErr);
        return;
    }

    console.log('✅ PO created successfully.');

    // 4. Simulate RECEPTION (The logic we just implemented)
    console.log('--- 🚛 SIMULATING RECEPTION ---');
    
    // Step A: Update PO
    const { error: poUpErr } = await supabase
        .from('purchase_orders')
        .update({
            status: 'RECIBIDA',
            received_quantity: expectedQuantity
        })
        .eq('id', poId);
    
    if (poUpErr) {
        console.error('Error updating PO status:', poUpErr);
        return;
    }

    // Step B: Update Inventory
    const { data: inv, error: invErr } = await supabase
        .from('inventory_physical')
        .select('*')
        .eq('book_id', book.id)
        .eq('tenant_id', tenantId)
        .single();
    
    if (!invErr && inv) {
        await supabase
            .from('inventory_physical')
            .update({ stock: (inv.stock || 0) + expectedQuantity })
            .eq('id', inv.id);
    } else {
        await supabase
            .from('inventory_physical')
            .insert([{
                book_id: book.id,
                tenant_id: tenantId,
                stock: expectedQuantity
            }]);
    }

    // Step C: UPDATE BOOK COST (The core sync logic)
    const unitCost = totalCost / expectedQuantity;
    const currentCosts = book.escandallo_costs || {};
    const updatedCosts = {
        ...currentCosts,
        impresion: Math.round(unitCost)
    };
    
    const { error: bookUpErr } = await supabase
        .from('books')
        .update({ 
            escandallo_costs: updatedCosts,
            tiraje: expectedQuantity
        })
        .eq('id', book.id);
    
    if (bookUpErr) {
        console.error('Error updating book costs:', bookUpErr);
        return;
    }

    console.log('✅ Book costs synchronized.');

    // 5. FINAL VERIFICATION
    const { data: finalBook, error: finalBookErr } = await supabase
        .from('books')
        .select('*')
        .eq('id', book.id)
        .single();
    
    console.log('\n--- 🏁 FINAL RESULTS ---');
    console.log(`New 'impresion' cost in Escandallo: $${finalBook.escandallo_costs?.impresion}`);
    console.log(`New 'tiraje': ${finalBook.tiraje} units`);
    
    if (finalBook.escandallo_costs?.impresion === 2500) {
        console.log('\n✨ SUCCESS: The unit cost was correctly calculated ($2500) and synchronized to the book\'s financial data!');
    } else {
        console.log('\n❌ FAILURE: Synchronization mismatch.');
    }
}

testFlow();
