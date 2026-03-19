import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from './courseSelector.styles';
import { ClubSummary } from '@/src/modules/golf/domain/golf.types';
import { parseCourseDisplayName } from '@/src/modules/golf/domain/golf.constants';

/**
 * [ClubItem] 구장 리스트 아이템
 */
interface ClubItemProps {
  club: ClubSummary;
  onPress: (club: ClubSummary) => void;
}

export const ClubItem = React.memo(({ club, onPress }: ClubItemProps) => (
  <TouchableOpacity
    style={styles.selectItem}
    onPress={() => onPress(club)}
  >
    <Text style={styles.selectText}>{club.name}</Text>
    <Text style={styles.selectSubText}>{club.courseCount}개 코스</Text>
  </TouchableOpacity>
));

/**
 * [CourseItem] 코스(전/후반) 선택 아이템
 */
interface CourseItemProps {
  course: { id: string; name: string };
  onPress: (course: { id: string; name: string }) => void;
}

export const CourseItem = React.memo(({ course, onPress }: CourseItemProps) => {
  const { label, direction, suffix } = parseCourseDisplayName(course.name);
  return (
    <TouchableOpacity 
      style={styles.selectItem} 
      onPress={() => onPress(course)}
    >
      <View style={styles.courseNameRow}>
        <Text style={styles.selectText}>{label} {suffix}</Text>
        {direction && (
          <View style={styles.directionBadge}>
            <Text style={styles.directionBadgeText}>{direction}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

/**
 * [TeeItem] 티박스 선택 아이템
 */
interface TeeItemProps {
  tee: string;
  onPress: (tee: string) => void;
}

export const TeeItem = React.memo(({ tee, onPress }: TeeItemProps) => (
  <TouchableOpacity 
    key={tee} 
    style={[styles.selectItem, { borderLeftWidth: 10, borderLeftColor: tee.toLowerCase() }]} 
    onPress={() => onPress(tee)}
  >
    <Text style={styles.selectText}>{tee} Tee</Text>
  </TouchableOpacity>
));
