import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iwbljdkmabwwcuzmmzhg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmxqZGttYWJ3d2N1em1temhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzI4ODMsImV4cCI6MjA4ODEwODg4M30.8pt5SasAi0tlrSGFtJ-KSR09PFw-BH6dP3NCRM8gs94'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkVersions() {
    console.log('Consultando versiones...')
    const { data, error } = await supabase
        .from('app_versions')
        .select('*')
        .order('release_date', { ascending: false })
        .limit(5)

    if (error) {
        console.error('Error:', error)
        process.exit(1)
    } else {
        console.log('Versiones encontradas:', JSON.stringify(data, null, 2))
        process.exit(0)
    }
}

checkVersions()
