import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://iwbljdkmabwwcuzmmzhg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmxqZGttYWJ3d2N1em1temhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzI4ODMsImV4cCI6MjA4ODEwODg4M30.8pt5SasAi0tlrSGFtJ-KSR09PFw-BH6dP3NCRM8gs94'
)

async function cleanLegacyDemo() {
    console.log('=== INICIANDO LIMPIEZA DE DATOS DEMO LEGACY (demo_*) ===\n')

    const tables = [
        'inventory_physical',
        'sales',
        'consignments',
        'books'
    ]

    for (const table of tables) {
        console.log(`🧹 Escaneando tabla: ${table}...`)
        
        // Find all records where id starts with demo_
        const { data: records, error: fetchErr } = await supabase.from(table).select('id').like('id', 'demo_%')
        
        if (fetchErr) {
            console.error(`   ❌ Error buscando en ${table}:`, fetchErr.message)
            continue
        }

        if (!records || records.length === 0) {
            console.log(`   ✅ 0 registros encontrados.`)
            continue
        }

        console.log(`   ⚠️ Encontrados ${records.length} registros legacy. Eliminando...`)
        
        // Delete them
        const idsToDelete = records.map(r => r.id)
        
        // Supabase REST max 1000 items in filter, but here we probably have around 50 max.
        const { error: delErr } = await supabase.from(table).delete().in('id', idsToDelete)
        
        if (delErr) {
            console.error(`   ❌ Error eliminando en ${table}:`, delErr.message)
        } else {
            console.log(`   ✅ Eliminados correctamente de ${table}.`)
        }
    }
    
    // Test book I accidentally injected
    console.log(`\n🧹 Buscando libro test (ffffffff-ff00-)...`)
    await supabase.from('inventory_physical').delete().like('id', 'ffffffff-ff00-%')
    await supabase.from('sales').delete().like('id', 'ffffffff-ff00-%')
    await supabase.from('consignments').delete().like('id', 'ffffffff-ff00-%')
    await supabase.from('books').delete().like('id', 'ffffffff-ff00-%')
    console.log(`✅ Libro test ffffffff eliminado.`)

    console.log('\n=== LIMPIEZA COMPLETADA ===')
}

cleanLegacyDemo().catch(console.error)
