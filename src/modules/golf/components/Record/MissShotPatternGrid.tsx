import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MissShotPatternGridProps {
    missShot: string;
    onTogglePattern: (pattern: string) => void;
}

const PATTERNS = ['없음', '슬라이스', '훅', '뒤땅/탑볼', '생크', '벙커', '쓰리펏'];

export const MissShotPatternGrid: React.FC<MissShotPatternGridProps> = ({
    missShot,
    onTogglePattern,
}) => {
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Ionicons name="analytics-outline" size={16} color="#FF6B6B" style={{ marginRight: 6 }} />
                <Text style={styles.title}>패턴 분석</Text>
            </View>
            <View style={styles.grid}>
                {PATTERNS.map((pattern) => {
                    const isSelected = pattern === '없음'
                        ? missShot === '없음' || !missShot
                        : (missShot ?? '').split(',').includes(pattern);

                    return (
                        <TouchableOpacity
                            key={pattern}
                            style={[
                                styles.patternBtn,
                                isSelected && (pattern === '없음' ? styles.noneActive : styles.active)
                            ]}
                            onPress={() => onTogglePattern(pattern)}
                        >
                            <Text style={[
                                styles.patternText,
                                isSelected && styles.activeText
                            ]}>{pattern}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 10,
        paddingBottom: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8
    },
    title: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0A2647'
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 6,
    },
    patternBtn: {
        minWidth: '22%',
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#F8F9FA',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E9ECEF',
        alignItems: 'center',
        justifyContent: 'center'
    },
    active: {
        backgroundColor: '#FF6B6B',
        borderColor: '#FF6B6B',
        boxShadow: '0 4px 8px rgba(255,107,107,0.3)',
    },
    noneActive: {
        backgroundColor: '#6c757d',
        borderColor: '#6c757d',
        boxShadow: '0 4px 8px rgba(108,117,125,0.3)',
    },
    patternText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#495057',
    },
    activeText: {
        color: '#fff',
    },
});
