import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function findEusebio() {
    const { data: users, error } = await supabase.from('users').select('*').ilike('name', '%Eusebio%')
    if (error) console.error(error)
    users?.forEach(u => console.log(`User: ${u.name} | Tenant: ${u.tenant_id} | Email: ${u.email}`))
}

findEusebio()
