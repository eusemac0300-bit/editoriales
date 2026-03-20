import { createClient } from '@supabase/supabase-js';
import * as db from './src/lib/supabaseService.js';

// Mock supabase since I'm in node but want to use the service
const supabase = createClient('https://iwbljdkmabwwcuzmmzhg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmxqZGttYWJ3d2N1em1temhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzI4ODMsImV4cCI6MjA4ODEwODg4M30.8pt5SasAi0tlrSGFtJ-KSR09PFw-BH6dP3NCRM8gs94');

async function testTransformations() {
    const tenantId = '2cdefd9e-5286-4014-9978-94d8a4bf01e5';
    const data = await db.loadAllData(tenantId);
    
    if (!data) {
        console.log('Data is NULL');
        return;
    }
    
    console.log('Keys in data:', Object.keys(data));
    console.log('Inventory structure:', Object.keys(data.inventory));
    console.log('Finances structure:', Object.keys(data.finances));
    
    // Check for any circular refs or huge data
    try {
        const json = JSON.stringify(data);
        console.log('JSON Length:', json.length);
    } catch (err) {
        console.error('Serialization error:', err);
    }
}
testTransformations();
