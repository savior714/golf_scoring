/**
 * @file app/(tabs)/_layout.tsx
 * @description 하단 탭 내비게이션 레이아웃
 */

import { useColorScheme } from '@/src/shared/components/useColorScheme';
import Colors from '@/src/shared/constants/Colors';
import { Tabs } from 'expo-router';
import { Edit3, History, LayoutDashboard } from 'lucide-react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

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
    </Tabs>
  );
}
