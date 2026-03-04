/**
 * @file src/modules/golf/golf.data.ts
 * @description 주요 골프장 코스 데이터 (Par 정보 포함)
 */

export interface CourseInfo {
    id: string;
    name: string;
    pars: number[]; // 18개 홀의 파 정보
    distances?: number[]; // 18개 홀의 전장 거리 (m)
}

export const PREDEFINED_COURSES: CourseInfo[] = [
    {
        id: 'arista-cc',
        name: '아리스타CC (레이크-마운틴)',
        pars: [4, 4, 3, 5, 4, 5, 4, 3, 4, 5, 3, 4, 4, 3, 4, 4, 5, 4],
        distances: [420, 380, 195, 465, 395, 535, 405, 185, 350, 540, 185, 320, 300, 180, 350, 335, 485, 385],
    },
    {
        id: 'custom',
        name: '직접 입력하기',
        pars: Array(18).fill(4),
    }
];
