import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface CourseHeaderProps {
    clubName: string;
    outCourseName: string;
    inCourseName: string;
    distanceMeter?: number;
    holeNumber: number;
}

export const CourseHeader: React.FC<CourseHeaderProps> = ({
    clubName,
    outCourseName,
    inCourseName,
    distanceMeter,
    holeNumber,
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.holeInfo}>
                <Text style={styles.holeLabel}>HOLE</Text>
                <Text style={styles.holeNumber}>{holeNumber}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.clubInfo}>
                <Text style={styles.clubName} numberOfLines={1}>{clubName}</Text>
                <View style={styles.courseRow}>
                    <Text style={styles.courseName}>{outCourseName}-{inCourseName}</Text>
                    {distanceMeter !== undefined && distanceMeter > 0 && (
                        <View style={styles.distanceBadge}>
                            <Text style={styles.distanceValue}>{distanceMeter}m</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 10,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        elevation: 2,
    },
    holeInfo: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: 10,
    },
    holeLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#ADB5BD',
        letterSpacing: 1,
    },
    holeNumber: {
        fontSize: 20,
        fontWeight: '900',
        color: '#0A2647',
        marginTop: -2,
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: '#E9ECEF',
        marginRight: 12,
    },
    clubInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    clubName: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0A2647',
        marginBottom: 2,
    },
    courseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    courseName: {
        fontSize: 12,
        color: '#6E85B7',
        fontWeight: '600',
    },
    distanceBadge: {
        backgroundColor: '#F1F3F5',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 6,
    },
    distanceValue: {
        fontSize: 11,
        fontWeight: '800',
        color: '#495057',
    },
});
