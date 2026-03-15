import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles/ScoreCardModal.styles';

/**
 * 스코어카드의 범례(Legend) 표시 컴포넌트
 */
export const ScoreCardLegend = React.memo(() => {
  return (
    <View style={styles.legendContainer}>
      <View style={styles.legendItem}>
        <View style={[styles.symbolCircle, styles.symbolDouble]}>
          <View style={styles.symbolCircleInner} />
        </View>
        <Text style={styles.legendLabel}>이글(-)</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={styles.symbolCircle} />
        <Text style={styles.legendLabel}>버디</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={styles.symbolDot} />
        <Text style={styles.legendLabel}>파</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={styles.symbolSquare} />
        <Text style={styles.legendLabel}>보기</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.symbolSquare, styles.symbolDouble]}>
          <View style={styles.symbolSquareInner} />
        </View>
        <Text style={styles.legendLabel}>더블보기(+)</Text>
      </View>
    </View>
  );
});
