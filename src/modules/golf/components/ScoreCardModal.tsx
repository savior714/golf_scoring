import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import ViewShot from 'react-native-view-shot';
import { Share2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ScoreCardTable } from '@/src/shared/components/ScoreCardTable';
import { HoleRecord } from '@/src/modules/golf/golf.types';
import { RefObject } from 'react';

interface ScoreCardModalProps {
  visible: boolean;
  courseName?: string;
  date?: string;
  holes: HoleRecord[];
  isSharing: boolean;
  viewShotRef: RefObject<ViewShot | null>;
  scoreCardDomRef: RefObject<View | null>;
  onClose: () => void;
  onShare: () => void;
}

export function ScoreCardModal({
  visible,
  courseName,
  date,
  holes,
  isSharing,
  viewShotRef,
  scoreCardDomRef,
  onClose,
  onShare,
}: ScoreCardModalProps) {
  const router = useRouter();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          entering={FadeInUp.duration(500)}
          exiting={FadeOutUp.duration(300)}
          style={styles.scoreCardContainer}
        >
          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <ViewShot
              ref={viewShotRef}
              options={{ format: 'png', quality: 0.9 }}
              style={styles.viewShotHighlight}
            >
              <View ref={scoreCardDomRef} style={styles.captureArea}>
                <View style={styles.scoreCardHeader}>
                  <Text style={styles.scoreCardTitle}>SCORE CARD</Text>
                  <Text style={styles.scoreCardSubTitle}>{courseName} ({date})</Text>
                </View>

                <View style={styles.tableGroup}>
                  <Text style={styles.coursePartTitle}>전반 코스</Text>
                  <ScoreCardTable
                    startHole={1}
                    endHole={9}
                    holes={holes}
                    onHolePress={(h) => {
                      onClose();
                      router.push({ pathname: '/(tabs)/record', params: { hole: h, mode: 'edit' } });
                    }}
                  />
                </View>

                <View style={styles.tableGroup}>
                  <Text style={styles.coursePartTitle}>후반 코스</Text>
                  <ScoreCardTable
                    startHole={10}
                    endHole={18}
                    holes={holes}
                    onHolePress={(h) => {
                      onClose();
                      router.push({ pathname: '/(tabs)/record', params: { hole: h, mode: 'edit' } });
                    }}
                  />
                </View>

                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View style={[styles.symbolCircle, styles.symbolDouble]}>
                      <View style={styles.symbolCircleInner} />
                    </View>
                    <Text style={styles.legendLabel}>이글(-)</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={styles.symbolCircle} />
                    <Text style={styles.legendLabel}>버디</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={styles.symbolDot} />
                    <Text style={styles.legendLabel}>파</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={styles.symbolSquare} />
                    <Text style={styles.legendLabel}>보기</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.symbolSquare, styles.symbolDouble]}>
                      <View style={styles.symbolSquareInner} />
                    </View>
                    <Text style={styles.legendLabel}>더블보기(+)</Text>
                  </View>
                </View>
              </View>
            </ViewShot>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.shareBtn, isSharing && { opacity: 0.7 }]}
              onPress={onShare}
              disabled={isSharing}
            >
              {isSharing
                ? <ActivityIndicator size="small" color="#fff" />
                : <Share2 size={18} color="#fff" />
              }
              <Text style={styles.shareBtnText}>
                {isSharing ? '준비 중...' : '이미지로 공유'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 38, 71, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scoreCardContainer: {
    width: '100%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 50,
    elevation: 20,
  },
  modalScrollView: {
    flexGrow: 0,
    borderRadius: 32,
  },
  modalScrollContent: {
    flexGrow: 1,
  },
  viewShotHighlight: {
    borderRadius: 32,
    overflow: 'hidden',
  },
  captureArea: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
  },
  scoreCardHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  scoreCardTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0A2647',
    letterSpacing: 2,
  },
  scoreCardSubTitle: {
    fontSize: 13,
    color: '#6E85B7',
    fontWeight: '600',
    marginTop: 6,
  },
  tableGroup: {
    width: '100%',
    marginBottom: 16,
  },
  coursePartTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#495057',
    marginBottom: 10,
    marginLeft: 4,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f8f9fa',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendLabel: {
    fontSize: 11,
    color: '#adb5bd',
    fontWeight: '600',
  },
  symbolCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#38E54D',
  },
  symbolCircleInner: {
    position: 'absolute',
    top: 1,
    left: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#38E54D',
  },
  symbolSquare: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  symbolSquareInner: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    position: 'absolute',
    top: 1,
    left: 1,
  },
  symbolDouble: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  symbolDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ADB5BD',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingHorizontal: 4, // 캡처 영역 패딩과 시각적 정렬을 위해 최소값 적용
  },
  shareBtn: {
    flex: 1,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  shareBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  closeBtn: {
    flex: 1,
    backgroundColor: '#F1F3F5',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#495057',
    fontSize: 15,
    fontWeight: '800',
  },
});
