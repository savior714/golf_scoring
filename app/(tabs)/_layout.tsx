/**
 * @file app/(tabs)/_layout.tsx
 * @description Bottom tab navigation layout.
 * - Determines admin status via the useIsAdmin hook.
 * - The 'Course Management' tab is hidden from non-admin users.
 */

import { useColorScheme } from '@/src/shared/components/useColorScheme';
import { useIsAdmin } from '@/src/shared/components/useIsAdmin';
import Colors from '@/src/shared/constants/Colors';
import { Tabs } from 'expo-router';
import { Edit3, History, LayoutDashboard, ShieldCheck } from 'lucide-react-native';
import { GestureResponderEvent, TouchableOpacity, TouchableOpacityProps } from 'react-native';

function NewRoundTabButton(props: TouchableOpacityProps) {
  const handlePress = (e: GestureResponderEvent) => {
    props.onPress?.(e);
  };

  return <TouchableOpacity {...props} onPress={handlePress} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAdmin, isLoading } = useIsAdmin();

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
          title: '스코어 입력',
          tabBarLabel: '새 라운딩',
          tabBarIcon: ({ color }) => <Edit3 color={color} size={24} />,
          tabBarButton: (props) => <NewRoundTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: '히스토리',
          tabBarIcon: ({ color }) => <History color={color} size={24} />,
        }}
      />
      {/* Admin-only tab — tabBarButton: null hides the button without remounting Navigator */}
      <Tabs.Screen
        name="admin"
        options={{
          title: '구장 관리',
          tabBarIcon: ({ color }) => <ShieldCheck color={color} size={24} />,
          tabBarButton: (isAdmin && !isLoading) ? undefined : () => null,
        }}
      />
    </Tabs>
  );
}

