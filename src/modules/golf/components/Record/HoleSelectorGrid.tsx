import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HoleSelectorGridProps {
    currentHole: number;
    totalHoles: number;
    holeRecords: any[];
    onSelectHole: (hole: number) => void;
    onClose: () => void;
}

export const HoleSelectorGrid: React.FC<HoleSelectorGridProps> = ({
    currentHole,
    totalHoles,
    holeRecords,
    onSelectHole,
    onClose,
}) => {
    const renderGrid = (start: number, end: number) => {
        const holes = [];
        for (let i = start; i <= end; i++) {
            const record = holeRecords.find((r) => r.holeNo === i);
            const isCompleted = record !== undefined;
            const isSelected = i === currentHole;

            holes.push(
                <TouchableOpacity
                    key={i}
                    style={[
                        styles.holeBtn,
                        isCompleted && styles.completedHole,
                        isSelected && styles.selectedHole,
                    ]}
                    onPress={() => {
                        onSelectHole(i);
                        onClose();
                    }}
                >
                    <Text
                        style={[
                            styles.holeText,
                            isCompleted && styles.completedHoleText,
                            isSelected && styles.selectedHoleText,
                        ]}
                    >
                        {i}
                    </Text>
                    {isCompleted && !isSelected && (
                        <Ionicons name="checkmark-circle" size={10} color="#38E54D" style={styles.checkIcon} />
                    )}
                </TouchableOpacity>
            );
        }
        return holes;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>HOLE SELECTOR</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                    <Ionicons name="close" size={24} color="#adb5bd" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.sectionTitle}>전반 (OUT)</Text>
                <View style={styles.grid}>{renderGrid(1, 9)}</View>

                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>후반 (IN)</Text>
                <View style={styles.grid}>{renderGrid(10, 18)}</View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0A2647',
        letterSpacing: 1,
    },
    closeIcon: {
        padding: 4,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#adb5bd',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    holeBtn: {
        width: '18%', // Approx 5 per row
        aspectRatio: 1,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    selectedHole: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
        boxShadow: '0 4px 8px rgba(0,122,255,0.3)',
    },
    completedHole: {
        borderColor: '#38E54D',
    },
    holeText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#495057',
    },
    selectedHoleText: {
        color: '#fff',
    },
    completedHoleText: {
        color: '#0A2647',
    },
    checkIcon: {
        position: 'absolute',
        top: 4,
        right: 4,
    },
    scrollContent: {
        paddingBottom: 20,
    },
});
