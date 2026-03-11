import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ScoreAdjusterProps {
    label: string;
    value: number;
    onAdjust: (delta: number) => void;
    accentColor?: string;
    minValue?: number;
}

export const ScoreAdjuster: React.FC<ScoreAdjusterProps> = React.memo(({
    label,
    value,
    onAdjust,
    accentColor = '#007AFF',
    minValue = 0,
}) => {
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.label}>{label}</Text>
            </View>
            <View style={styles.counterRow}>
                <TouchableOpacity
                    style={[styles.btn, { backgroundColor: '#F1F3F5' }]}
                    onPress={() => onAdjust(-1)}
                    disabled={value <= minValue}
                >
                    <Text style={[styles.btnText, { color: value <= minValue ? '#adb5bd' : '#495057' }]}>-</Text>
                </TouchableOpacity>

                <Text style={styles.valueText}>{value}</Text>

                <TouchableOpacity
                    style={[styles.btn, { backgroundColor: accentColor }]}
                    onPress={() => onAdjust(1)}
                >
                    <Text style={styles.btnText}>+</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 12,
        marginBottom: 0, // Margin is handled by the parent container
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeader: {
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 10,
        fontWeight: '900',
        color: '#6E85B7',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    counterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    btn: {
        width: 48,
        height: 48,
        borderRadius: 14, // Squircle-like
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    btnText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '600',
    },
    valueText: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0A2647',
    },
});
