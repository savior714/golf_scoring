import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eqzobqeotfxvsllforew.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxem9icWVvdGZ4dnNsbGZvcmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MjczMjAsImV4cCI6MjA4ODIwMzMyMH0.bbzV2PaIuuBWh1SjkklBFvRc0Qo3kd5GXjmCQMWeQOg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
    console.log('--- Inspecting tables ---');
    const { data, error } = await supabase.from('golf_courses').select('id, name').limit(1);
    if (error) {
        console.log('Error selecting golf_courses:', error.message);
    } else {
        console.log('golf_courses exists, first row:', data[0]);
    }
}

checkTables();
