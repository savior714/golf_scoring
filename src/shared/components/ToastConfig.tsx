import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { ToastConfig, ToastConfigParams } from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

// ────────────────────────────────────────────────────────────
// isVisible 기반 fade-out 래퍼 (사라질 때 부드럽게 fade)
// ────────────────────────────────────────────────────────────
function FadeToast({
  isVisible,
  children,
}: {
  isVisible: boolean;
  children: React.ReactNode;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -10, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [isVisible, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

// ────────────────────────────────────────────────────────────
// 토스트 내부 콘텐츠
// ────────────────────────────────────────────────────────────
function ToastContent({
  iconName,
  iconColor,
  borderColor,
  text1,
  text2,
}: {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  borderColor: string;
  text1?: string;
  text2?: string;
}) {
  return (
    <View style={[styles.customToast, { borderLeftColor: borderColor }]}>
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={20} color={iconColor} />
      </View>
      <View style={styles.content}>
        {text1 && <Text style={styles.title}>{text1}</Text>}
        {text2 && <Text style={styles.message}>{text2}</Text>}
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────
// 타입별 toast 렌더러
// ────────────────────────────────────────────────────────────
export const toastConfig: ToastConfig = {
  success: ({ text1, text2, isVisible }: ToastConfigParams<unknown>) => (
    <FadeToast isVisible={isVisible}>
      <ToastContent
        iconName="checkmark-circle"
        iconColor="#28a745"
        borderColor="#28a745"
        text1={text1}
        text2={text2}
      />
    </FadeToast>
  ),
  error: ({ text1, text2, isVisible }: ToastConfigParams<unknown>) => (
    <FadeToast isVisible={isVisible}>
      <ToastContent
        iconName="alert-circle"
        iconColor="#FF3B30"
        borderColor="#FF3B30"
        text1={text1}
        text2={text2}
      />
    </FadeToast>
  ),
  info: ({ text1, text2, isVisible }: ToastConfigParams<unknown>) => (
    <FadeToast isVisible={isVisible}>
      <ToastContent
        iconName="information-circle"
        iconColor="#007AFF"
        borderColor="#007AFF"
        text1={text1}
        text2={text2}
      />
    </FadeToast>
  ),
};

// ────────────────────────────────────────────────────────────
// 스타일
// ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  customToast: {
    height: 60,
    width: '90%',
    backgroundColor: '#0A2647',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  content: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  message: {
    color: '#E9ECEF',
    fontSize: 12,
    fontWeight: '500',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
