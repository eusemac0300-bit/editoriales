import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://iwbljdkmabwwcuzmmzhg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmxqZGttYWJ3d2N1em1temhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzI4ODMsImV4cCI6MjA4ODEwODg4M30.8pt5SasAi0tlrSGFtJ-KSR09PFw-BH6dP3NCRM8gs94'
)

async function debug() {
    console.log('=== INVENTARIO ACTUAL ===')
    const { data: inv, error } = await supabase
        .from('inventory_physical')
        .select('id, book_id, stock, exits')
        .order('book_id')

    if (error) { console.error('Error:', error); return }

    inv.forEach(i => {
        console.log(`id=${i.id} | book_id=${i.book_id} | stock=${i.stock} | exits=${i.exits?.length || 0}`)
    })

    // Simular exactamente lo que hace Sales.jsx:
    // - Buscar por bookId === 'b3' (como lo hace el código local)
    const bookId = 'b3'
    console.log(`\n=== TEST DESCUENTO para book_id=${bookId} ===`)

    // Este es el query que ahora Sales.jsx usa desde el estado local
    // El problema puede ser que el estado local no tenga el 'id'
    // Vamos a probar el UPDATE directo por book_id
    const { data: rows } = await supabase
        .from('inventory_physical')
        .select('id, book_id, stock, exits')
        .eq('book_id', bookId)
        .limit(1)

    console.log('Fila encontrada:', JSON.stringify(rows))

    if (rows && rows.length > 0) {
        const row = rows[0]
        const newStock = Math.max(0, row.stock - 3)
        const exits = [...(row.exits || []), { date: '2026-03-09', qty: 3, ref: 'TEST_DIRECTO' }]

        const { data: updated, error: upErr } = await supabase
            .from('inventory_physical')
            .update({ stock: newStock, exits })
            .eq('id', row.id)
            .select('id, stock')

        console.log('Update error:', upErr)
        console.log('Resultado update:', JSON.stringify(updated))

        // Verificar RLS - intenta con .eq('book_id', bookId) en vez de id
        const { data: updated2, error: upErr2 } = await supabase
            .from('inventory_physical')
            .update({ stock: newStock - 1 })
            .eq('book_id', bookId)
            .select('id, stock')

        console.log('Update por book_id error:', upErr2)
        console.log('Resultado update2:', JSON.stringify(updated2))
    }

    // Verificar ventas recientes
    console.log('\n=== ÚLTIMAS 3 VENTAS ===')
    const { data: sales } = await supabase
        .from('sales')
        .select('id, book_id, quantity, status')
        .order('created_at', { ascending: false })
        .limit(3)
    sales.forEach(s => console.log(`id=${s.id} | book=${s.book_id} | qty=${s.quantity} | status=${s.status}`))
}

debug()
