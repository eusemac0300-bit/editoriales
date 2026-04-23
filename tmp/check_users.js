import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function checkUsers() {
    console.log('\n--- Usuarios de Tenant 8d9b4e80-d9c1-4cec-bd1a-2b276e9c2c85 ---')
    const { data: users, error } = await supabase.from('users').select('*').eq('tenant_id', '8d9b4e80-d9c1-4cec-bd1a-2b276e9c2c85')
    if (error) console.error(error)
    users?.forEach(u => console.log(`User: ${u.name} | Role: ${u.role} | Email: ${u.email}`))
}

checkUsers()
