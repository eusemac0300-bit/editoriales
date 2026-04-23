import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function findMarteAcrossTenants() {
    console.log('\n--- Buscando "marte a un paso" en todos los tenants ---')
    const { data: books, error } = await supabase.from('books').select('id, title, tenant_id').ilike('title', '%marte a un paso%')
    if (error) console.error(error)
    books?.forEach(b => console.log(`Book: ${b.title} | ID: ${b.id} | Tenant: ${b.tenant_id}`))
}

findMarteAcrossTenants()
