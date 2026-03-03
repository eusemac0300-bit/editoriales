import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

let envFile = null
try {
    envFile = fs.readFileSync('.env', 'utf-8')
} catch (e) {
    envFile = fs.readFileSync('.env.local', 'utf-8')
}

const vars = {}
envFile.split('\n').filter(Boolean).forEach(line => {
    if (line.includes('=')) {
        const [key, ...rest] = line.split('=')
        vars[key.trim()] = rest.join('=').trim().replace(/['"]/g, '')
    }
})

const supabaseUrl = vars['VITE_SUPABASE_URL']
const supabaseAnonKey = vars['VITE_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseAnonKey) {
    console.log('Faltan credenciales')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createSuperAdmin() {
    console.log('Creando cuenta Super Admin Master...')
    const tenantId = 't_master'
    const userId = 'u_master'

    // Primero creamos el tenant Master para alojar al Super Admin
    const { error: tErr } = await supabase.from('tenants').insert({
        id: tenantId,
        name: 'Editorial Pro (SaaS Master)',
        plan: 'INF',
        active: true
    })

    if (tErr && tErr.code !== '23505') { // Ignore duplicate key if ran multiple times
        console.error('Error al crear tenant master:', tErr)
        process.exit(1)
    }

    // Ahora creamos el usuario Super Admin
    const { error: uErr } = await supabase.from('users').insert({
        id: userId,
        tenant_id: tenantId,
        email: 'master@editorialpro.com',
        password: 'masterpassword2026',
        name: 'Super Admin',
        role: 'SUPERADMIN',
        title: 'Dueño del SaaS',
        first_login: false
    })

    if (uErr && uErr.code !== '23505') {
        console.error('Error al crear usuario super admin:', uErr)
        process.exit(1)
    }

    console.log('✅ ¡Cuenta SUPERADMIN creada con éxito!')
    console.log('👉 Email: master@editorialpro.com')
    console.log('👉 Contraseña: masterpassword2026')
}

createSuperAdmin()
