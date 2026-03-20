import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://iwbljdkmabwwcuzmmzhg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmxqZGttYWJ3d2N1em1temhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzI4ODMsImV4cCI6MjA4ODEwODg4M30.8pt5SasAi0tlrSGFtJ-KSR09PFw-BH6dP3NCRM8gs94'
);

async function testEventsTable() {
    console.log('--- Testing Events Table ---');
    const { data: events, error: eventsErr } = await supabase.from('events').select('*').limit(1);
    console.log('Events check:', eventsErr ? 'ERROR: ' + eventsErr.message : 'SUCCESS (Empty or has data)');
    
    const { data: items, error: itemsErr } = await supabase.from('event_items').select('*').limit(1);
    console.log('Event Items check:', itemsErr ? 'ERROR: ' + itemsErr.message : 'SUCCESS (Empty or has data)');
}

testEventsTable();
