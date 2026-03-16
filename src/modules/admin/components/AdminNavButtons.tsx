import { FileJson, FileSearch, MessageSquare, Users } from 'lucide-react-native';
import { memo } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '@/src/modules/admin/styles/adminStyles';

interface AdminNavButtonsProps {
    onLoadClub: () => void;
}

export const AdminNavButtons = memo(function AdminNavButtons({ onLoadClub }: AdminNavButtonsProps) {
    const router = useRouter();

    return (
        <>
            <TouchableOpacity style={styles.loadBtn} onPress={onLoadClub}>
                <FileSearch size={18} color="#007AFF" />
                <Text style={styles.loadBtnText}>기존 구장 불러오기 (수정)</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.loadBtn, { backgroundColor: '#E8F8F0', borderColor: '#2ECC7130', marginBottom: 12 }]}
                onPress={() => router.push('/admin_users' as Parameters<typeof router.push>[0])}
            >
                <Users size={18} color="#2ECC71" />
                <Text style={[styles.loadBtnText, { color: '#2ECC71' }]}>사용자 통계 및 관리 (Users)</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.loadBtn, { backgroundColor: '#FEF3C7', borderColor: '#B4530930', marginBottom: 12 }]}
                onPress={() => router.push('/admin_requests' as Parameters<typeof router.push>[0])}
            >
                <MessageSquare size={18} color="#B45309" />
                <Text style={[styles.loadBtnText, { color: '#B45309' }]}>구장 추가 요청 내역 (Requests)</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.loadBtn, { backgroundColor: '#F0F4F8', borderColor: '#6E85B730' }]}
                onPress={() => router.push('/admin_import' as Parameters<typeof router.push>[0])}
            >
                <FileJson size={18} color="#6E85B7" />
                <Text style={[styles.loadBtnText, { color: '#6E85B7' }]}>JSON 대량 임포트 (Bulk)</Text>
            </TouchableOpacity>
        </>
    );
});
