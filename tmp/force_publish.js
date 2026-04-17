import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iwbljdkmabwwcuzmmzhg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmxqZGttYWJ3d2N1em1temhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzI4ODMsImV4cCI6MjA4ODEwODg4M30.8pt5SasAi0tlrSGFtJ-KSR09PFw-BH6dP3NCRM8gs94'

const supabase = createClient(supabaseUrl, supabaseKey)

const version = "v3.1.5.78"
const notes = ['Manual Data Stability', 'Authors fix', 'Suppliers FK fix', 'Sales Tax Fix']

async function forcePublish() {
    console.log(`Forzando publicación de versión ${version}...`)
    const { data, error } = await supabase
        .from('app_versions')
        .insert({
            version,
            notes,
            release_date: new Date().toISOString()
        })
        .select()

    if (error) {
        console.error('Error al publicar:', error)
        process.exit(1)
    } else {
        console.log('¡ÉXITO! Versión publicada:', JSON.stringify(data[0], null, 2))
        process.exit(0)
    }
}

forcePublish()
