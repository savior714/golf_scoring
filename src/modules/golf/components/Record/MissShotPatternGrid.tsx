import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MissShotPatternGridProps {
    missShot: string;
    onTogglePattern: (pattern: string) => void;
}

const PATTERNS = ['없음', '슬라이스', '훅', '뒤땅/탑볼', '생크', '벙커', '쓰리펏'];

export const MissShotPatternGrid: React.FC<MissShotPatternGridProps> = React.memo(({
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
});

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        paddingBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 11,
        fontWeight: '900',
        color: '#6E85B7',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
    },
    patternBtn: {
        minWidth: '22%',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E9ECEF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    active: {
        backgroundColor: '#FF6B6B',
        borderColor: '#FF6B6B',
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    noneActive: {
        backgroundColor: '#6c757d',
        borderColor: '#6c757d',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    patternText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#495057',
    },
    activeText: {
        color: '#fff',
    },
});
