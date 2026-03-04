import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://iwbljdkmabwwcuzmmzhg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmxqZGttYWJ3d2N1em1temhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzI4ODMsImV4cCI6MjA4ODEwODg4M30.8pt5SasAi0tlrSGFtJ-KSR09PFw-BH6dP3NCRM8gs94');

async function fix() {
    console.log("Configurando eusemac como SUPERADMIN y a admin@admind.cl...");

    // Update eusemac
    await supabase.from('users').update({ role: 'SUPERADMIN' }).eq('email', 'eusemac@me.com');

    // Make sure admin@admind.cl exists
    const { data: existingAdmin } = await supabase.from('users').select('id').eq('email', 'admin@admind.cl').single();

    if (!existingAdmin) {
        console.log("Creando admin@admind.cl...");

        // Check if there is a master tenant
        const { data: masterTenant } = await supabase.from('tenants').select('id').eq('id', 't_master').single();
        if (!masterTenant) {
            await supabase.from('tenants').insert({ id: 't_master', name: 'Editorial Pro (SaaS Master)', plan: 'INF' });
        }

        await supabase.from('users').insert({
            id: `u_admind_${Date.now()}`,
            tenant_id: 't_master',
            email: 'admin@admind.cl',
            password: 'admin123',
            name: 'Súper Administrador',
            role: 'SUPERADMIN',
            avatar: 'SA',
            title: 'Master',
            first_login: false
        });
    } else {
        await supabase.from('users').update({ role: 'SUPERADMIN', password: 'admin123' }).eq('email', 'admin@admind.cl');
    }

    // Remove Carolina Mendez as SUPERADMIN (or any master admin email that is not these two)
    // Initially we gave carolina ADMIN, not SUPERADMIN. But we can just make sure master@editorialpro.com is updated if it exists, maybe delete it.
    await supabase.from('users').delete().eq('email', 'master@editorialpro.com');

    console.log("Script terminado.");
}
fix().catch(console.error);
