import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function checkStock() {
    console.log('\n--- Stock en Inventario Físico ---')
    const { data: inv, error: iErr } = await supabase.from('inventory_physical').select('*, books(title)')
    if (iErr) console.error(iErr)
    inv?.forEach(i => console.log(`Libro: ${i.books?.title || i.book_id} | Stock Bodega: ${i.stock} | Tenant: ${i.tenant_id}`))
}

checkStock()
