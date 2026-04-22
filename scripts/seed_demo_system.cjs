
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function seed() {
  console.log('Seeding demo/fallback system IDs...');

  // 1. Seed Tenants
  const tenants = [
    { id: '00000000-0000-0000-0000-000000000000', name: 'Sistema Central' },
    { id: 'demo-tenant-id', name: 'Editorial Demo' }
  ];

  for (const t of tenants) {
    const { error } = await supabase.from('tenants').upsert(t);
    if (error) console.error(`Error seeding tenant ${t.id}:`, error.message);
    else console.log(`Tenant ${t.id} ready.`);
  }

  // 2. Seed Users
  const users = [
    { 
        id: 'super-val-uid', 
        tenant_id: '00000000-0000-0000-0000-000000000000', 
        email: 'master@editorial.cl', 
        password: 'admin', 
        role: 'SUPERADMIN', 
        name: 'Eusebio Manriquez (Owner)' 
    },
    { 
        id: 'master-val-uid', 
        tenant_id: '00000000-0000-0000-0000-000000000000', 
        email: 'contacto@dpiprint.cl', 
        password: 'admin', 
        role: 'ADMIN', 
        name: 'Administrador Maestro' 
    },
    { 
        id: 'trial-demo-uid', 
        tenant_id: 'demo-tenant-id', 
        email: 'trial@editorial.cl', 
        password: 'demo', 
        role: 'ADMIN', 
        name: 'Usuario Trial (Demo)' 
    }
  ];

  for (const u of users) {
    const { error } = await supabase.from('users').upsert(u);
    if (error) console.error(`Error seeding user ${u.id}:`, error.message);
    else console.log(`User ${u.id} ready.`);
  }

  console.log('Finished seeding system IDs.');
}

seed();
