import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://iwbljdkmabwwcuzmmzhg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmxqZGttYWJ3d2N1em1temhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzI4ODMsImV4cCI6MjA4ODEwODg4M30.8pt5SasAi0tlrSGFtJ-KSR09PFw-BH6dP3NCRM8gs94');

async function clearRequests() {
    console.log("Borrando todas las solicitudes de onboarding...");
    const { error } = await supabase
        .from('onboarding_requests')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("¡Borrado completo!");
    }
}
clearRequests();
