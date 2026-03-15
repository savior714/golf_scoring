import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles/ScoreCardModal.styles';

interface ScoreCardHeaderProps {
  courseName?: string;
  date?: string;
}

/**
 * 스코어카드 상단 헤더 컴포넌트
 */
export const ScoreCardHeader = React.memo(({ courseName, date }: ScoreCardHeaderProps) => {
  return (
    <View style={styles.scoreCardHeader}>
      <Text style={styles.scoreCardTitle}>SCORE CARD</Text>
      <Text style={styles.scoreCardSubTitle}>{courseName} ({date})</Text>
    </View>
  );
});
