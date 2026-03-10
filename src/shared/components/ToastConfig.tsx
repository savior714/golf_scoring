import { View, Text, StyleSheet } from 'react-native';
import { ToastConfig } from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

const styles = StyleSheet.create({
  customToast: {
    height: 60,
    width: '90%',
    backgroundColor: '#0A2647', // Navy
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
  successBorder: {
    borderLeftColor: '#28a745', // Green
  },
  errorBorder: {
    borderLeftColor: '#FF3B30', // Red
  },
  infoBorder: {
    borderLeftColor: '#007AFF', // Blue
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
  }
});

export const toastConfig: ToastConfig = {
  success: ({ text1, text2 }) => (
    <View style={[styles.customToast, styles.successBorder]}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={20} color="#28a745" />
      </View>
      <View style={styles.content}>
        {text1 && <Text style={styles.title}>{text1}</Text>}
        {text2 && <Text style={styles.message}>{text2}</Text>}
      </View>
    </View>
  ),
  error: ({ text1, text2 }) => (
    <View style={[styles.customToast, styles.errorBorder]}>
      <View style={styles.iconContainer}>
        <Ionicons name="alert-circle" size={20} color="#FF3B30" />
      </View>
      <View style={styles.content}>
        {text1 && <Text style={styles.title}>{text1}</Text>}
        {text2 && <Text style={styles.message}>{text2}</Text>}
      </View>
    </View>
  ),
  info: ({ text1, text2 }) => (
    <View style={[styles.customToast, styles.infoBorder]}>
      <View style={styles.iconContainer}>
        <Ionicons name="information-circle" size={20} color="#007AFF" />
      </View>
      <View style={styles.content}>
        {text1 && <Text style={styles.title}>{text1}</Text>}
        {text2 && <Text style={styles.message}>{text2}</Text>}
      </View>
    </View>
  )
};
