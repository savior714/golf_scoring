import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').filter(line => line.includes('=')).forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) env[key.trim()] = value.join('=').trim();
});

const supabaseUrl = env['EXPO_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['EXPO_PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPurge() {
    // 1. 하나만 골라서 시도
    const { data: list } = await supabase.from('golf_clubs').select('id, name').ilike('name', '%테스트%').limit(1);
    
    if (!list || list.length === 0) {
       console.log('테스트 구장이 없습니다.');
       return;
    }
    
    const targetId = list[0].id;
    console.log(`테스트 대상: ${list[0].name} (${targetId})`);
    
    // delete with select() to see what happened
    const { data, error } = await supabase
        .from('golf_clubs')
        .delete()
        .eq('id', targetId)
        .select();
    
    if (error) {
        console.error('DELETE ERROR:', error);
    } else {
        console.log('DELETE RESULT DATA:', data);
        if (data && data.length === 0) {
            console.log('❌ SUCCESS but ZERO ROWS DELETED. (RLS policy might be blocking you!)');
        } else {
            console.log('✅ DELETED SUCCESSFULLY!');
        }
    }
}

debugPurge();
