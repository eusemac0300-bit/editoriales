import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    const tenantId = 't_master'
    const now = new Date().toISOString()
    const demoBooks = Array.from({ length: 1 }).map((_, i) => ({
        id: `demo_b${i}_${Date.now()}`,
        tenant_id: tenantId,
        title: `Libro de Ejemplo ${i + 1}`,
        author_name: `Autor Ejemplo ${i + 1}`,
        status: i < 3 ? 'Original' : i < 6 ? 'Edición' : i < 8 ? 'Imprenta' : 'Publicado',
        pvp: 15000 + (i * 1000),
        format: 'Físico',
        created_at: now
    }))

    console.log("Inserting:", demoBooks)
    const { data, error } = await supabase.from('books').insert(demoBooks).select()
    console.log("Insert result:", error, data)
}
run();
