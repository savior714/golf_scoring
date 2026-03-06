import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ScoreAdjusterProps {
    label: string;
    value: number;
    onAdjust: (delta: number) => void;
    accentColor?: string;
    minValue?: number;
}

export const ScoreAdjuster: React.FC<ScoreAdjusterProps> = ({
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
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    },
    cardHeader: {
        alignItems: 'center',
        marginBottom: 8
    },
    label: {
        fontSize: 13,
        fontWeight: '800',
        color: '#6E85B7',
        letterSpacing: 0.5,
        textTransform: 'uppercase'
    },
    counterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    btn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center'
    },
    btnText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold'
    },
    valueText: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0A2647'
    },
});
