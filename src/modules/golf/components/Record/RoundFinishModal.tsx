import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../styles/record.styles';

interface RoundFinishModalProps {
  visible: boolean;
  onLater: () => void;
  onConfirm: () => void;
}

export function RoundFinishModal({ visible, onLater, onConfirm }: RoundFinishModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onLater}>
      <View style={styles.modalOverlay}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.confirmModal}>
          <View style={styles.confirmIconBg}>
            <Ionicons name="trophy-outline" size={32} color="#007AFF" />
          </View>
          <Text style={styles.confirmTitle}>라운딩 완료!</Text>
          <Text style={styles.confirmMessage}>
            18홀 기록이 모두 안전하게 저장되었습니다.{"\n"}최종 스코어와 리포트를 확인하시겠습니까?
          </Text>

          <View style={styles.confirmBtnRow}>
            <TouchableOpacity style={styles.confirmCancelBtn} onPress={onLater}>
              <Text style={styles.confirmCancelText}>나중에</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmOkBtn} onPress={onConfirm}>
              <Text style={styles.confirmOkText}>결과 확인</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
