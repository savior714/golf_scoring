/**
 * @file app/(tabs)/_layout.tsx
 * @description Bottom tab navigation layout.
 * - Determines admin status via the useIsAdmin hook.
 * - The 'Course Management' tab is hidden from non-admin users.
 */

import { useCallback, useMemo } from 'react';
import { useColorScheme } from '@/src/shared/components/useColorScheme';
import { useIsAdmin } from '@/src/shared/components/useIsAdmin';
import Colors from '@/src/shared/constants/Colors';
import { Tabs, useRouter } from 'expo-router';
import { Edit3, History, LayoutDashboard, ShieldCheck } from 'lucide-react-native';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { roundRepository } from '@/src/modules/golf/golf.repository';

import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';

// TabLayout 외부에 정의 — 매 렌더마다 새 참조 생성을 방지하여 탭 flicker 제거
interface RecordTabButtonProps extends BottomTabBarButtonProps {
  onNavigate: () => void;
}
function RecordTabButton({ onNavigate, ...props }: RecordTabButtonProps) {
  return <TouchableOpacity {...(props as TouchableOpacityProps)} onPress={onNavigate} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAdmin, isLoading } = useIsAdmin();
  const router = useRouter();

  const { data: currentRoundId, isLoading: isLoadingRound } = useQuery({
    queryKey: ['current_round_id'],
    queryFn: () => roundRepository.getCurrentRoundId(),
  });

  const recordTabLabel = isLoadingRound
    ? '확인 중...'
    : (currentRoundId ? '기록 수정' : '스코어 입력');

  // 진행 중인 라운드 있음 → mode=edit로 세션 복원 / 없음 → mode=new로 새 라운딩
  // router.replace: history stack 누적 방지 (탭 네이티브 동작과 일치)
  const handleRecordTabPress = useCallback(() => {
    if (currentRoundId) {
      router.replace({ pathname: '/(tabs)/record', params: { mode: 'edit' } });
    } else {
      router.replace({ pathname: '/(tabs)/record', params: { mode: 'new', t: Date.now().toString() } });
    }
  }, [currentRoundId, router]);

  const recordTabButton = useMemo(
    () => (props: BottomTabBarButtonProps) =>
      <RecordTabButton {...props} onNavigate={handleRecordTabPress} />,
    [handleRecordTabPress]
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: true,
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '대시보드',
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: recordTabLabel,
          headerShown: false,
          tabBarLabel: recordTabLabel,
          tabBarIcon: ({ color }) => <Edit3 color={color} size={24} />,
          tabBarButton: recordTabButton,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: '히스토리',
          tabBarIcon: ({ color }) => <History color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: '구장 관리',
          tabBarIcon: ({ color }) => <ShieldCheck color={color} size={24} />,
          // 로딩 중에는 탭을 유지하여 Jank 방지, 로딩 완료 후 권한 없으면 null 처리
          href: isLoading ? undefined : (isAdmin ? undefined : null),
        }}
      />
    </Tabs>
  );
}

