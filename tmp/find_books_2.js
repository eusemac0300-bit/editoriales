import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function findBooks() {
    console.log('\n--- Buscando libros ---')
    const { data: books, error } = await supabase.from('books').select('id, title, tenant_id')
    if (error) console.error(error)
    const targets = ['marte a un paso', 'mambo', 'tigres']
    books?.forEach(b => {
        const title = (b.title || '').toLowerCase()
        if (targets.some(t => title.includes(t))) {
            console.log(`Match: ${b.title} | ID: ${b.id} | Tenant: ${b.tenant_id}`)
        }
    })
}

findBooks()
