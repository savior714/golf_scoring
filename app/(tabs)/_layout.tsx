/**
 * @file app/(tabs)/_layout.tsx
 * @description 하단 탭 내비게이션 레이아웃
 * - useIsAdmin 훅으로 관리자 여부 판단
 * - 비관리자에게는 '구장 관리' 탭이 노출되지 않음
 */

import { useColorScheme } from '@/src/shared/components/useColorScheme';
import { useIsAdmin } from '@/src/shared/components/useIsAdmin';
import Colors from '@/src/shared/constants/Colors';
import { Tabs } from 'expo-router';
import { Edit3, History, LayoutDashboard, ShieldCheck } from 'lucide-react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAdmin } = useIsAdmin();

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
          title: '기록기',
          tabBarIcon: ({ color }) => <Edit3 color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: '히스토리',
          tabBarIcon: ({ color }) => <History color={color} size={24} />,
        }}
      />
      {/* 관리자만 탭 노출 — href: null이면 탭 버튼이 완전히 숨겨짐 */}
      <Tabs.Screen
        name="admin"
        options={{
          title: '구장 관리',
          tabBarIcon: ({ color }) => <ShieldCheck color={color} size={24} />,
          href: isAdmin ? '/(tabs)/admin' : null,
        }}
      />
    </Tabs>
  );
}

