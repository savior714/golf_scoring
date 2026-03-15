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
import { Tabs } from 'expo-router';
import { Edit3, History, LayoutDashboard, ShieldCheck } from 'lucide-react-native';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { roundRepository } from '@/src/modules/golf/golf.repository';

import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';

// TabLayout 외부에 정의 — 매 렌더마다 새 참조 생성을 방지하여 탭 flicker 제거
interface RecordTabButtonProps extends BottomTabBarButtonProps {
  onNavigate: (e: unknown) => void;
}
function RecordTabButton({ onNavigate, ...props }: RecordTabButtonProps) {
  return (
    <TouchableOpacity 
      {...(props as TouchableOpacityProps)} 
      onPress={(e) => {
        // 1. 커스텀 로직(파라미터 주입 등) 실행
        onNavigate(e);
        // 2. Tab 기본 동작(화면 전환) 수행
        props.onPress?.(e);
      }} 
    />
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAdmin, isLoading } = useIsAdmin();


  const { data: currentRoundId, isLoading: isLoadingRound } = useQuery({
    queryKey: ['current_round_id'],
    queryFn: () => roundRepository.getCurrentRoundId(),
  });

  const recordTabLabel = isLoadingRound
    ? '확인 중...'
    : (currentRoundId ? '기록 수정' : '스코어 입력');

  /**
   * [Refactor] handleRecordTabPress
   * - 탭 버튼 클릭 시 Native onPress와 함께 실행됨.
   * - router.setParams를 제거하여 현재 탭의 파라미터 오염 방지.
   * - 초기 모드 결정 로직은 이제 record.tsx의 useFocusEffect에서 담당함.
   */
  const handleRecordTabPress = useCallback((_e: unknown) => {
    // router.setParams 호출 제거 (Link의 기본 동작만 수행되도록 유도)
  }, []);

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

