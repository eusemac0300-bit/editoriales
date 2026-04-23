import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function checkBooksByTenant() {
    console.log('\n--- Libros por Tenant ---')
    const { data: books, error } = await supabase.from('books').select('id, title, tenant_id')
    if (error) console.error(error)
    books?.forEach(b => console.log(`Book: ${b.title} | ID: ${b.id} | Tenant: ${b.tenant_id}`))
}

checkBooksByTenant()
