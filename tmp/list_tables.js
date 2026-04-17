import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iwbljdkmabwwcuzmmzhg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmxqZGttYWJ3d2N1em1temhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzI4ODMsImV4cCI6MjA4ODEwODg4M30.8pt5SasAi0tlrSGFtJ-KSR09PFw-BH6dP3NCRM8gs94'

const supabase = createClient(supabaseUrl, supabaseKey)

async function listTables() {
    console.log('Listando tablas...')
    // En Supabase, puedes intentar consultar la tabla 'tenants' que es común
    const { data: tenants, error: tError } = await supabase.from('tenants').select('id').limit(1)
    if (tError) console.error('Error al leer tenants:', tError)
    else console.log('Tabla tenants existe.')

    const { data: users, error: uError } = await supabase.from('users').select('id').limit(1)
    if (uError) console.error('Error al leer users:', uError)
    else console.log('Tabla users existe.')

    process.exit(0)
}

listTables()
