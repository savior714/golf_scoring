import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eqzobqeotfxvsllforew.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxem9icWVvdGZ4dnNsbGZvcmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MjczMjAsImV4cCI6MjA4ODIwMzMyMH0.bbzV2PaIuuBWh1SjkklBFvRc0Qo3kd5GXjmCQMWeQOg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    console.log('--- Inspecting "rounds" table columns ---');
    const { data: rounds, error: roundsErr } = await supabase.from('rounds').select('*').limit(1);
    if (roundsErr) {
        console.log('Error selecting rounds:', roundsErr.message, roundsErr.details);
    } else {
        console.log('Rounds columns:', Object.keys(rounds[0] || {}));
    }

    console.log('\n--- Inspecting "holes" table columns ---');
    const { data: holes, error: holesErr } = await supabase.from('holes').select('*').limit(1);
    if (holesErr) {
        console.log('Error selecting holes:', holesErr.message, holesErr.details);
    } else {
        console.log('Hole columns:', Object.keys(holes[0] || {}));
    }
}

checkSchema();
