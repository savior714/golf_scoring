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

async function purgeAll() {
    console.log('--- DB "테스트" 구장 정밀 삭제 및 에러 확인 시작 ---');

    const { data: list, error: fetchErr } = await supabase
        .from('golf_clubs')
        .select('id, name')
        .or('name.ilike.%테스트%,is_verified.eq.false');

    if (fetchErr) {
        console.error('FETCH ERROR:', fetchErr);
        return;
    }

    if (!list || list.length === 0) {
        console.log('정리할 구장이 없습니다.');
        return;
    }

    console.log(`총 ${list.length}개의 정리 대상 발견`);

    for (const club of list) {
        process.stdout.write(`삭제 시도: ${club.name} (${club.id})... `);
        const { error: delErr } = await supabase
            .from('golf_clubs')
            .delete()
            .eq('id', club.id);

        if (delErr) {
            console.log(`\n❌ ERROR: ${JSON.stringify(delErr)}`);
            if (delErr.code === '23503') {
                console.log('  -> 외래 키 제약 조건에 의해 삭제할 수 없습니다. 관련 데이터를 먼저 확인하십시오.');
            }
        } else {
            process.stdout.write('✅ SUCCESS\n');
        }
    }

    console.log('--- 정리 시도 완료 ---');
}

purgeAll();
