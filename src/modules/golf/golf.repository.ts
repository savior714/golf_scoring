import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../shared/lib/supabase';
import type { ClubCourseInfo, ClubInfo, ClubSummary, GolfRound } from './golf.types';

const BASE_STORAGE_KEY = '@golf_rounds_data';

/**
 * 사용자 세션 기반 저장소 키 캐싱 (Singleton Promise 패턴)
 * - 동시 다발적 호출 시 단 한 번만 getSession()을 실행하여 Race Condition 제거
 */
let storageKeyPromise: Promise<string> | null = null;

function getStorageKey(): Promise<string> {
    if (storageKeyPromise) return storageKeyPromise;

    storageKeyPromise = supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.id) {
            return `${BASE_STORAGE_KEY}_${session.user.id}`;
        }
        return BASE_STORAGE_KEY; // Fallback for anonymous or guest
    });

    return storageKeyPromise;
}

// 인증 상태 변경 시 캐시 초기화 (다음 호출 시 재계산)
supabase.auth.onAuthStateChange(() => {
    storageKeyPromise = null;
});

export const roundRepository = {
    /**
     * 모든 라운딩 기록 조회
     */
    async getAllRounds(): Promise<GolfRound[]> {
        try {
            const key = await getStorageKey();
            const jsonValue = await AsyncStorage.getItem(key);
            const localRounds: GolfRound[] = jsonValue != null ? JSON.parse(jsonValue) : [];
            return localRounds;
        } catch (e) {
            console.error('Failed to fetch rounds from local storage', e);
            return [];
        }
    },

    /**
     * 클라우드(Supabase)에서 모든 라운딩 데이터 가져오기
     */
    async pullRoundsFromSupabase(sessionOverride?: import('@supabase/supabase-js').Session | null): Promise<{ success: boolean; count: number; error?: unknown }> {
        try {
            // sessionOverride: onAuthStateChange 콜백에서 전달받은 세션을 직접 사용 (타이밍 불일치 방지)
            const session = sessionOverride ?? (await supabase.auth.getSession()).data.session;
            if (!session) return { success: false, count: 0 };

            // 1. 라운드 정보 조회
            const { data: roundsData, error: roundsError } = await supabase
                .from('rounds')
                .select('*')
                .eq('user_id', session.user.id)
                .order('date', { ascending: false });

            if (roundsError) throw roundsError;
            if (!roundsData || roundsData.length === 0) return { success: true, count: 0 };

            // 2. 전체 홀 정보 조회 (한 번의 요청으로 최적화)
            const roundIds = roundsData.map(r => r.id);
            const { data: holesData, error: holesError } = await supabase
                .from('holes')
                .select('*')
                .in('round_id', roundIds);

            if (holesError) throw holesError;

            const remoteRounds: GolfRound[] = roundsData.map(r => ({
                id: r.id,
                date: r.date,
                courseName: r.course_name,
                courseType: r.course_type,
                outCourseId: r.out_course_id,
                inCourseId: r.in_course_id,
                memo: r.memo || '',
                updatedAt: r.updated_at ? new Date(r.updated_at).getTime() : 0,
                holes: (holesData || [])
                    .filter(h => h.round_id === r.id)
                    .map(h => ({
                        holeNo: h.hole_no,
                        par: h.par,
                        stroke: h.stroke,
                        putt: h.putt,
                        isFairway: h.is_fairway,
                        isGIR: h.is_gir,
                        ob: h.ob,
                        penalty: h.penalty,
                        missShot: h.miss_shot
                    }))
                    .sort((a, b) => a.holeNo - b.holeNo)
            }));

            // 4. 로컬 데이터와 병합 (ID 기준 최신화)
            const key = await getStorageKey();
            const localJson = await AsyncStorage.getItem(key);
            const localRounds: GolfRound[] = localJson ? JSON.parse(localJson) : [];

            // 병합 로직: 클라우드와 로컬 중 최신(updatedAt) 데이터를 우선함
            const mergedRoundsMap = new Map<string, GolfRound>();

            // 1) 로컬 데이터를 먼저 채움
            localRounds.forEach(r => mergedRoundsMap.set(r.id, r));

            // 2) 클라우드 데이터가 더 최신인 경우에만 덮어씀
            remoteRounds.forEach(remote => {
                const local = mergedRoundsMap.get(remote.id);
                if (!local || remote.updatedAt > (local.updatedAt || 0)) {
                    mergedRoundsMap.set(remote.id, remote);
                }
            });

            const mergedRounds = Array.from(mergedRoundsMap.values());
            await AsyncStorage.setItem(key, JSON.stringify(mergedRounds));
            return { success: true, count: remoteRounds.length };
        } catch (e) {
            console.error('Failed to pull from Supabase', e);
            return { success: false, count: 0, error: e };
        }
    },

    /**
     * 새로운 라운딩 저장 또는 업데이트
     */
    async saveRound(newRound: GolfRound): Promise<void> {
        try {
            // 저장 시점에 updatedAt 갱신
            const roundToSave = { ...newRound, updatedAt: Date.now() };
            const key = await getStorageKey();
            const jsonValue = await AsyncStorage.getItem(key);
            const existingRounds: GolfRound[] = jsonValue != null ? JSON.parse(jsonValue) : [];
            const updatedRounds = [roundToSave, ...existingRounds.filter(r => r.id !== newRound.id)];
            await AsyncStorage.setItem(key, JSON.stringify(updatedRounds));
        } catch (e) {
            console.error('Failed to save round', e);
        }
    },

    /**
     * Supabase 클라우드 동기화
     */
    async syncRoundToSupabase(round: GolfRound): Promise<{ success: boolean; error?: unknown }> {
        try {
            // 0. 사용자 식별
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            // 1. 라운드 정보 Upsert
            const { error: roundError } = await supabase
                .from('rounds')
                .upsert({
                    id: round.id,
                    user_id: session.user.id,
                    date: round.date,
                    course_name: round.courseName,
                    course_type: round.courseType,
                    out_course_id: round.outCourseId,
                    in_course_id: round.inCourseId,
                    memo: round.memo,
                    updated_at: new Date(round.updatedAt || Date.now()).toISOString()
                });

            if (roundError) throw roundError;

            // 2. 홀 정보 Upsert (Batch)
            if (round.holes.length > 0) {
                const holesToSync = round.holes.map(h => ({
                    round_id: round.id,
                    hole_no: h.holeNo,
                    par: h.par,
                    stroke: h.stroke,
                    putt: h.putt,
                    is_fairway: h.isFairway,
                    is_gir: h.isGIR,
                    ob: h.ob,
                    penalty: h.penalty,
                    miss_shot: h.missShot
                }));

                const { error: holeError } = await supabase
                    .from('holes')
                    .upsert(holesToSync, { onConflict: 'round_id,hole_no' });

                if (holeError) throw holeError;
            }

            return { success: true };
        } catch (e) {
            console.error('Supabase sync failed', e);
            return { success: false, error: e };
        }
    },

    /**
     * 현재 진행 중인 라운딩 ID 조회
     */
    async getCurrentRoundId(): Promise<string | null> {
        return await AsyncStorage.getItem('@current_round_id');
    },

    /**
     * 현재 진행 중인 라운딩 ID 설정
     */
    async setCurrentRoundId(roundId: string | null): Promise<void> {
        if (roundId === null) {
            await AsyncStorage.removeItem('@current_round_id');
        } else {
            await AsyncStorage.setItem('@current_round_id', roundId);
        }
    },

    /**
     * 모든 로컬 데이터를 Supabase로 일괄 동기화
     */
    async syncAllLocalRounds(): Promise<{ total: number; success: number; errors: unknown[] }> {
        const rounds = await this.getAllRounds();
        const results = await Promise.all(rounds.map(round => this.syncRoundToSupabase(round)));

        const errors: unknown[] = results
            .filter(r => !r.success)
            .map((r, i) => ({ id: rounds[i].id, error: r.error }));

        return { total: rounds.length, success: rounds.length - errors.length, errors };
    },

    /**
     * 익명 사용자 데이터를 현재 로그인된 사용자로 마이그레이션
     */
    async migrateAnonymousData(): Promise<{ migrated: number; errors: unknown[] }> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return { migrated: 0, errors: ['User not logged in'] };

            // 1. 구형 키에서 데이터 로드
            const anonymousDataJson = await AsyncStorage.getItem(BASE_STORAGE_KEY);
            const currentRoundId = await AsyncStorage.getItem('@current_round_id');

            if (!anonymousDataJson && !currentRoundId) {
                return { migrated: 0, errors: [] };
            }

            const anonymousRounds: GolfRound[] = anonymousDataJson ? JSON.parse(anonymousDataJson) : [];
            // 과거 데이터에 updatedAt이 없을 수 있으므로 보정
            anonymousRounds.forEach(r => { if (!r.updatedAt) r.updatedAt = 0; });

            // 2. 신규 사용자 키로 데이터 병합 및 저장
            const userKey = await getStorageKey();
            const existingUserJson = await AsyncStorage.getItem(userKey);
            const existingUserRounds: GolfRound[] = existingUserJson ? JSON.parse(existingUserJson) : [];
            existingUserRounds.forEach(r => { if (!r.updatedAt) r.updatedAt = 0; });

            // 중복 제거 및 최신성 기반 병합
            const mergedRoundsMap = new Map<string, GolfRound>();
            existingUserRounds.forEach(r => mergedRoundsMap.set(r.id, r));
            anonymousRounds.forEach(anon => {
                const existing = mergedRoundsMap.get(anon.id);
                if (!existing || anon.updatedAt > existing.updatedAt) {
                    mergedRoundsMap.set(anon.id, anon);
                }
            });

            const mergedRounds = Array.from(mergedRoundsMap.values());
            await AsyncStorage.setItem(userKey, JSON.stringify(mergedRounds));

            // 3. 클라우드 기습 동기화 (가장 소중한 데이터를 서버로!)
            const syncResults = await Promise.all(anonymousRounds.map(r => this.syncRoundToSupabase(r)));
            const migratedCount = syncResults.filter(r => r.success).length;
            const errors: unknown[] = syncResults.filter(r => !r.success).map(r => r.error);

            // 4. 익명 데이터 삭제 (안전하게 동기화 시도 후 또는 이전 완료 후)
            await AsyncStorage.removeItem(BASE_STORAGE_KEY);
            // 진행 중인 라운드 ID는 유지 (이미 다른 로직에서 처리 가능하게)

            return { migrated: anonymousRounds.length, errors };
        } catch (e) {
            console.error('Migration failed', e);
            return { migrated: 0, errors: [e] };
        }
    },

    /**
     * 라운딩 기록 삭제
     */
    async deleteRound(roundId: string): Promise<void> {
        try {
            // 1. 로컬 삭제
            const key = await getStorageKey();
            const jsonValue = await AsyncStorage.getItem(key);
            const existingRounds: GolfRound[] = jsonValue != null ? JSON.parse(jsonValue) : [];
            const updatedRounds = existingRounds.filter(r => r.id !== roundId);
            await AsyncStorage.setItem(key, JSON.stringify(updatedRounds));

            // 현재 진행 중인 라운드와 같다면 초기화
            const currentId = await this.getCurrentRoundId();
            if (currentId === roundId) {
                await this.setCurrentRoundId(null);
            }

            // 2. 원격 삭제 (Supabase) - cascade 설정으로 holes도 자동 삭제됨
            const { error } = await supabase.from('rounds').delete().eq('id', roundId);
            if (error) throw error;

        } catch (e) {
            console.error('Failed to delete round', e);
            throw e;
        }
    }
};

// ============================================================
// [CLUB MASTER REPOSITORY] 구장 마스터 데이터 CRUD
// ============================================================

export const clubRepository = {

    /**
     * 전체 구장 목록 조회 (경량 요약 - 구장 선택 드롭다운용)
     * 단일 JOIN 쿼리로 N+1 문제 방지
     */
    async getAllClubsSummary(): Promise<ClubSummary[]> {
        const { data, error } = await supabase
            .from('golf_clubs')
            .select(`
                id,
                name,
                golf_courses (
                    id,
                    name,
                    hole_count
                )
            `)
            .order('name', { ascending: true });

        if (error) {
            console.error('[clubRepository] getAllClubsSummary 실패', error);
            return [];
        }

        return (data || []).map(club => ({
            id: club.id,
            name: club.name,
            courseCount: (club.golf_courses as any[])?.length ?? 0,
            courses: ((club.golf_courses as any[]) || []).map(c => ({
                id: c.id,
                name: c.name,
                holeCount: c.hole_count,
            })),
        }));
    },

    /**
     * 특정 코스의 전체 홀+전장 정보 조회 (라운드 시작 시 Par 데이터 로딩용)
     */
    async getCourseWithHoles(courseId: string): Promise<ClubCourseInfo | null> {
        const { data, error } = await supabase
            .from('golf_courses')
            .select(`
                id,
                club_id,
                name,
                hole_count,
                golf_holes (
                    id,
                    course_id,
                    hole_number,
                    par,
                    handicap_idx,
                    hole_distances (
                        tee_color,
                        distance_meter
                    )
                )
            `)
            .eq('id', courseId)
            .single();

        if (error || !data) {
            console.error('[clubRepository] getCourseWithHoles 실패', error);
            return null;
        }

        const holes = ((data.golf_holes as any[]) || [])
            .sort((a, b) => a.hole_number - b.hole_number)
            .map(h => ({
                id: h.id,
                courseId: h.course_id,
                holeNumber: h.hole_number,
                par: h.par,
                handicapIdx: h.handicap_idx,
                distances: ((h.hole_distances as any[]) || []).map((d: any) => ({
                    teeColor: d.tee_color,
                    distanceMeter: d.distance_meter,
                })),
            }));

        return {
            id: data.id,
            clubId: data.club_id,
            name: data.name,
            holeCount: data.hole_count,
            holes,
        };
    },

    /**
     * 신규 구장 등록 (Club > Course > Hole > Distance 순서 보장)
     * - upsert 패턴으로 중복 등록 방지
     * - Par 합계 검증 (9홀: 36, 18홀: 72) 선행
     */
    async registerClub(payload: {
        clubName: string;
        courses: {
            courseName: string;
            holes: {
                holeNumber: number;
                par: number;
                distances?: { teeColor: string; distanceMeter: number }[];
            }[];
        }[];
    }): Promise<{ success: boolean; clubId?: string; error?: string }> {
        // [검증] 홀별 Par 유효성 체크 (3~7 범위)
        for (const course of payload.courses) {
            const invalidHoles = course.holes.filter(h => h.par < 3 || h.par > 7);
            if (invalidHoles.length > 0) {
                const msg = `[Par 검증 오류] "${course.courseName}" 코스에 유효 범위(3~7) 외 Par가 있습니다: 홀 ${invalidHoles.map(h => h.holeNumber).join(', ')}`;
                console.error(msg);
                return { success: false, error: msg };
            }
        }

        try {
            // 1. Club upsert
            const { data: club, error: clubErr } = await supabase
                .from('golf_clubs')
                .upsert({ name: payload.clubName }, { onConflict: 'name' })
                .select('id')
                .single();

            if (clubErr || !club) throw clubErr ?? new Error('Club upsert 실패');

            for (const course of payload.courses) {
                // 2. Course upsert
                const { data: newCourse, error: courseErr } = await supabase
                    .from('golf_courses')
                    .upsert(
                        { club_id: club.id, name: course.courseName, hole_count: course.holes.length },
                        { onConflict: 'club_id,name' }
                    )
                    .select('id')
                    .single();

                if (courseErr || !newCourse) throw courseErr ?? new Error('Course upsert 실패');

                for (const hole of course.holes) {
                    // 3. Hole upsert
                    const { data: newHole, error: holeErr } = await supabase
                        .from('golf_holes')
                        .upsert(
                            { course_id: newCourse.id, hole_number: hole.holeNumber, par: hole.par },
                            { onConflict: 'course_id,hole_number' }
                        )
                        .select('id')
                        .single();

                    if (holeErr || !newHole) throw holeErr ?? new Error('Hole upsert 실패');

                    // 4. Distance upsert (데이터 존재 시)
                    if (hole.distances && hole.distances.length > 0) {
                        const distEntries = hole.distances.map(d => ({
                            hole_id: newHole.id,
                            tee_color: d.teeColor,
                            distance_meter: d.distanceMeter,
                        }));
                        const { error: distErr } = await supabase
                            .from('hole_distances')
                            .upsert(distEntries, { onConflict: 'hole_id,tee_color' });

                        if (distErr) throw distErr;
                    }
                }
            }

            console.log(`[clubRepository] "${payload.clubName}" 구장 등록 완료 (id: ${club.id})`);
            return { success: true, clubId: club.id };

        } catch (e: any) {
            console.error('[clubRepository] registerClub 실패', e);
            return { success: false, error: e?.message ?? String(e) };
        }
    },

    /**
     * 특정 구장의 전체 코스 + 홀 + 전장 정보 조회 (수정 모드용)
     */
    async getClubFullInfo(clubId: string): Promise<ClubInfo | null> {
        const { data, error } = await supabase
            .from('golf_clubs')
            .select(`
                id,
                name,
                golf_courses (
                    id,
                    club_id,
                    name,
                    hole_count,
                    golf_holes (
                        id,
                        course_id,
                        hole_number,
                        par,
                        handicap_idx,
                        hole_distances (
                            tee_color,
                            distance_meter
                        )
                    )
                )
            `)
            .eq('id', clubId)
            .single();

        if (error || !data) {
            console.error('[clubRepository] getClubFullInfo 실패', error);
            return null;
        }

        const courses = ((data.golf_courses as any[]) || []).map(c => ({
            id: c.id,
            clubId: c.club_id,
            name: c.name,
            holeCount: c.hole_count,
            holes: ((c.golf_holes as any[]) || [])
                .sort((a, b) => a.hole_number - b.hole_number)
                .map(h => ({
                    id: h.id,
                    courseId: h.course_id,
                    holeNumber: h.hole_number,
                    par: h.par,
                    handicapIdx: h.handicap_idx,
                    distances: ((h.hole_distances as any[]) || []).map((d: any) => ({
                        teeColor: d.tee_color,
                        distanceMeter: d.distance_meter,
                    })),
                })),
        }));

        return {
            id: data.id,
            name: data.name,
            courses,
        };
    },
};

