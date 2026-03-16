import { ClubSummary } from '@/src/modules/golf/golf.types';
import ChevronDown from 'lucide-react-native/dist/icons/chevron-down';
import X from 'lucide-react-native/dist/icons/x';
import { memo } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { styles } from '@/src/modules/admin/styles/adminStyles';

interface ClubSelectModalProps {
    visible: boolean;
    isLoading: boolean;
    clubList: ClubSummary[];
    onClose: () => void;
    onSelect: (clubId: string) => void;
}

export const ClubSelectModal = memo(function ClubSelectModal({
    visible,
    isLoading,
    clubList,
    onClose,
    onSelect,
}: ClubSelectModalProps) {
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
                <Animated.View entering={FadeIn} style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>기존 구장 선택</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#0A2647" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.clubListScroll}>
                        {isLoading ? (
                            <ActivityIndicator style={{ marginTop: 20 }} color="#0A2647" />
                        ) : clubList.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyListText}>등록된 구장이 없습니다.</Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.listStats}>
                                    <Text style={styles.listStatsText}>
                                        전체 {clubList.length}개 (검증 {clubList.filter(c => c.isVerified).length} / 미검증 {clubList.filter(c => !c.isVerified).length})
                                    </Text>
                                </View>
                                {clubList.map(club => (
                                    <TouchableOpacity
                                        key={club.id}
                                        style={styles.clubListItem}
                                        onPress={() => onSelect(club.id)}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Text style={styles.clubListItemName}>{club.name}</Text>
                                            {club.isVerified && (
                                                <View style={styles.verifiedBadgeMini}>
                                                    <Text style={styles.verifiedBadgeTextMini}>✓</Text>
                                                </View>
                                            )}
                                        </View>
                                        <View style={styles.clubListItemCourse}>
                                            <Text style={styles.courseCountText}>{club.courseCount}개 코스</Text>
                                            <ChevronDown size={14} color="#adb5bd" />
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}
                    </ScrollView>
                </Animated.View>
            </TouchableOpacity>
        </Modal>
    );
});
