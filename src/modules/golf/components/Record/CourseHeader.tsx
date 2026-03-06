import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface CourseHeaderProps {
    clubName: string;
    outCourseName: string;
    inCourseName: string;
    distanceMeter?: number;
}

export const CourseHeader: React.FC<CourseHeaderProps> = ({
    clubName,
    outCourseName,
    inCourseName,
    distanceMeter,
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.clubInfo}>
                <Ionicons name="location-sharp" size={14} color="#007AFF" />
                <Text style={styles.clubName}>{clubName}</Text>
                <Text style={styles.courseName}> ({outCourseName}-{inCourseName})</Text>
            </View>
            {distanceMeter !== undefined && (
                <View style={styles.distanceInfo}>
                    <Text style={styles.distanceLabel}>DISTANCE </Text>
                    <Text style={styles.distanceValue}>{distanceMeter > 0 ? `${distanceMeter}m` : '-'}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    },
    clubInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    clubName: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0A2647',
        marginLeft: 4,
    },
    courseName: {
        fontSize: 12,
        color: '#6E85B7',
        fontWeight: '600',
    },
    distanceInfo: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    distanceLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#ADB5BD',
    },
    distanceValue: {
        fontSize: 14,
        fontWeight: '900',
        color: '#495057',
    },
});
