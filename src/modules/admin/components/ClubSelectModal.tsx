import { ClubSummary } from '@/src/modules/golf/domain/golf.types';
import { ChevronDown, Search, X } from 'lucide-react-native';
import { memo, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Text,
    TextInput,
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
    const [searchText, setSearchText] = useState('');

    const filteredList = useMemo(() => {
        if (!searchText.trim()) return clubList;
        return clubList.filter(club =>
            club.name.toLowerCase().includes(searchText.toLowerCase())
        );
    }, [clubList, searchText]);

    const renderItem = ({ item: club }: { item: ClubSummary }) => (
        <TouchableOpacity
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
    );

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

                    <View style={styles.searchBarContainer}>
                        <Search size={20} color="#adb5bd" style={{ marginLeft: 12 }} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="구장 이름으로 검색..."
                            value={searchText}
                            onChangeText={setSearchText}
                            placeholderTextColor="#adb5bd"
                            clearButtonMode="while-editing"
                        />
                    </View>

                    {isLoading ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator color="#0A2647" />
                        </View>
                    ) : (
                        <FlatList
                            data={filteredList}
                            keyExtractor={(item) => item.id}
                            renderItem={renderItem}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            ListHeaderComponent={
                                <View style={styles.listStats}>
                                    <Text style={styles.listStatsText}>
                                        {searchText.trim() ? `검색 결과 ${filteredList.length}개` : `전체 ${clubList.length}개 (검증 ${clubList.filter(c => c.isVerified).length} / 미검증 ${clubList.filter(c => !c.isVerified).length})`}
                                    </Text>
                                </View>
                            }
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyListText}>
                                        {searchText.trim() ? '검색 결과가 없습니다.' : '등록된 구장이 없습니다.'}
                                    </Text>
                                </View>
                            }
                            initialNumToRender={10}
                            maxToRenderPerBatch={10}
                            windowSize={5}
                            removeClippedSubviews={true}
                        />
                    )}
                </Animated.View>
            </TouchableOpacity>
        </Modal>
    );
});
