/**
 * @file app/(tabs)/notice.tsx
 * @description 공지사항 화면
 * - 모든 사용자: 공지 목록 조회
 * - 관리자 전용: 공지 작성 / 수정 / 삭제
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Pencil, Plus, Trash2, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/src/shared/lib/supabase';
import { useIsAdmin } from '@/src/shared/components/useIsAdmin';
import { QUERY_KEYS } from '@/src/shared/lib/queryKeys';
import { styles } from '@/src/modules/golf/styles/notice.styles';

// ============================================================
// [Notice] 공지사항 데이터 타입
// ============================================================
interface Notice {
  id: string;
  title: string;
  body: string | null;
  created_at: string;
}

// ============================================================
// [NoticeCard] 개별 공지 카드
// ============================================================
interface NoticeCardProps {
  item: Notice;
  isAdmin: boolean;
  onEdit: (item: Notice) => void;
  onDelete: (id: string) => void;
}

function NoticeCard({ item, isAdmin, onEdit, onDelete }: NoticeCardProps) {
  const date = new Date(item.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.card}>
      <Text style={styles.cardDate}>{date}</Text>
      <Text style={styles.cardTitle}>{item.title}</Text>
      {item.body ? <Text style={styles.cardBody}>{item.body}</Text> : null}
      {isAdmin && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.cardActionBtn, { borderColor: '#007AFF20', backgroundColor: '#007AFF08' }]}
            onPress={() => onEdit(item)}
          >
            <Pencil size={13} color="#007AFF" />
            <Text style={[styles.cardActionText, { color: '#007AFF' }]}>수정</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cardActionBtn, { borderColor: '#FF6B6B20', backgroundColor: '#FF6B6B08' }]}
            onPress={() => onDelete(item.id)}
          >
            <Trash2 size={13} color="#FF6B6B" />
            <Text style={[styles.cardActionText, { color: '#FF6B6B' }]}>삭제</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ============================================================
// [NoticeScreen] 메인 화면
// ============================================================
export default function NoticeScreen() {
  const { isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const { data: notices, isLoading } = useQuery<Notice[]>({
    queryKey: QUERY_KEYS.notices(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notices')
        .select('id, title, body, created_at')
        .order('created_at', { ascending: false });
      if (error) return [];
      return data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { mutate: saveNotice, isPending } = useMutation({
    mutationFn: async () => {
      const payload = { title: title.trim(), body: body.trim() || null };

      if (editingNotice) {
        console.log('[Notice] Updating:', editingNotice.id, payload);
        const { data, error } = await supabase
          .from('notices')
          .update(payload)
          .eq('id', editingNotice.id)
          .select();
        console.log('[Notice] Update Result:', { data, error });
        if (error) throw error;
      } else {
        console.log('[Notice] Creating:', payload);
        const { data, error } = await supabase
          .from('notices')
          .insert(payload)
          .select();
        console.log('[Notice] Create Result:', { data, error });
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notices() });
      handleClose();
    },
    onError: (e) => {
      Alert.alert('오류', `저장에 실패했습니다.\n${e.message}`);
    },
  });

  const { mutate: deleteNotice } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notices() });
    },
    onError: (e) => Alert.alert('오류', `삭제에 실패했습니다.\n${e.message}`),
  });

  const handleOpenCreate = () => {
    setEditingNotice(null);
    setTitle('');
    setBody('');
    setIsModalVisible(true);
  };

  const handleOpenEdit = (item: Notice) => {
    setEditingNotice(item);
    setTitle(item.title);
    setBody(item.body ?? '');
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('공지 삭제', '이 공지를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteNotice(id) },
    ]);
  };

  const handleClose = () => {
    setIsModalVisible(false);
    setEditingNotice(null);
    setTitle('');
    setBody('');
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('알림', '제목을 입력해주세요.');
      return;
    }
    saveNotice();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#0A2647" style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={notices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NoticeCard
            item={item}
            isAdmin={isAdmin}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Megaphone size={48} color="#C8D8E8" />
            <Text style={styles.emptyText}>등록된 공지사항이 없습니다.</Text>
          </View>
        }
      />

      {/* 관리자 전용 FAB */}
      {isAdmin && (
        <TouchableOpacity style={styles.fab} onPress={handleOpenCreate}>
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* 공지 작성 / 수정 모달 */}
      <Modal visible={isModalVisible} animationType="slide" transparent onRequestClose={handleClose}>
        <Pressable style={styles.modalOverlay} onPress={handleClose}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalWrapper}
          >
            <Pressable style={styles.modalSheet} onPress={() => {}}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingNotice ? '공지 수정' : '공지 작성'}</Text>
                <TouchableOpacity onPress={handleClose}>
                  <X size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>제목 *</Text>
              <TextInput
                style={styles.input}
                placeholder="공지 제목을 입력하세요"
                placeholderTextColor="#9DA8B4"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />

              <Text style={styles.inputLabel}>내용</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="내용을 입력하세요 (선택)"
                placeholderTextColor="#9DA8B4"
                value={body}
                onChangeText={setBody}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.submitBtn, isPending && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={isPending}
              >
                {isPending
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Text style={styles.submitBtnText}>{editingNotice ? '수정 완료' : '공지 등록'}</Text>
                }
              </TouchableOpacity>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
