import { HoleRecord } from "@/src/modules/golf/domain/golf.types";
import { ScoreCardTable } from "@/src/shared/components/ScoreCardTable";
import { useRouter } from "expo-router";
import { Share2 } from "lucide-react-native";
import { RefObject } from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import ViewShot from "react-native-view-shot";
import { styles } from "../styles/ScoreCardModal.styles";
import { ScoreCardHeader } from "./ScoreCardHeader";
import { ScoreCardLegend } from "./ScoreCardLegend";

interface ScoreCardModalProps {
  visible: boolean;
  courseName?: string;
  courseType?: string;
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
  courseType,
  date,
  holes,
  isSharing,
  viewShotRef,
  scoreCardDomRef,
  onClose,
  onShare,
}: ScoreCardModalProps) {
  const router = useRouter();

  const [outName, inName] = courseType?.split("-") || ["전반", "후반"];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          entering={FadeInUp.duration(400)}
          style={styles.scoreCardContainer}
        >
          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {holes.length === 18 && (
              <View style={styles.promoContainer}>
                <Text style={styles.promoText}>
                  오늘 라운딩은 즐거우셨나요?
                </Text>
                <Text style={styles.promoSubText}>
                  많은 홍보 부탁드립니다. ⛳
                </Text>
              </View>
            )}

            <ViewShot
              ref={viewShotRef}
              options={{ format: "png", quality: 0.9 }}
              style={styles.viewShotHighlight}
            >
              <View ref={scoreCardDomRef} style={styles.captureArea}>
                <ScoreCardHeader courseName={courseName} date={date} />

                <View style={styles.tableGroup}>
                  <Text style={styles.coursePartTitle}>{outName} 코스</Text>
                  <ScoreCardTable
                    startHole={1}
                    endHole={9}
                    holes={holes}
                    onHolePress={(h) => {
                      onClose();
                      router.replace({
                        pathname: "/(tabs)/record",
                        params: { hole: h, mode: "edit" },
                      });
                    }}
                  />
                </View>

                <View style={styles.tableGroup}>
                  <Text style={styles.coursePartTitle}>{inName} 코스</Text>
                  <ScoreCardTable
                    startHole={10}
                    endHole={18}
                    holes={holes}
                    onHolePress={(h) => {
                      onClose();
                      router.replace({
                        pathname: "/(tabs)/record",
                        params: { hole: h, mode: "edit" },
                      });
                    }}
                  />
                </View>

                <ScoreCardLegend />
              </View>
            </ViewShot>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.shareBtn, isSharing && { opacity: 0.7 }]}
              onPress={onShare}
              disabled={isSharing}
            >
              {isSharing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Share2 size={18} color="#fff" />
              )}
              <Text style={styles.shareBtnText}>
                {isSharing ? "준비 중..." : "이미지로 공유"}
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
