/**
 * @file src/modules/admin/domain/admin.types.ts
 * @description Admin module domain types and constants.
 */

export const TEE_COLORS = [
    { key: 'Black', label: '블랙', color: '#212529' },
    { key: 'Blue', label: '블루', color: '#007AFF' },
    { key: 'White', label: '화이트', color: '#495057' },
    { key: 'Red', label: '레드', color: '#FF6B6B' },
] as const;

export type TeeColorKey = typeof TEE_COLORS[number]['key'];

export interface HoleInput {
    holeNumber: number;
    par: string;
    distances: Partial<Record<TeeColorKey, string>>;
}

export interface CourseInput {
    id?: string;
    courseName: string;
    holes: HoleInput[];
    activeTees: TeeColorKey[];
}

export interface BulkImportPayload {
    jsonText: string;
}

export interface ImportSummary {
    count: number;
    success: boolean;
    error?: { message: string };
}

export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    role: string;
    avatar_url?: string;
    created_at: string;
    last_active_at: string;
    rounds_count?: number;
}

export interface CourseRequest {
    id: string;
    user_id: string;
    requested_club_name: string;
    status: "pending" | "completed" | "rejected";
    created_at: string;
    updated_at: string;
    profiles?: {
        full_name: string;
        email: string;
    };
}
