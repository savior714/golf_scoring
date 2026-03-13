import React from 'react';
import { TouchableOpacity, View, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles/record.styles';

interface RecordFooterProps {
  currentHole: number;
  insetsBottom: number;
  isMounted: boolean;
  saveCurrentHole: () => Promise<any>;
  setCurrentHole: (update: any) => void;
  handleNextHole: () => Promise<any>;
  finishRound: () => Promise<any>;
}

export const RecordFooter: React.FC<RecordFooterProps> = ({
  currentHole,
  insetsBottom,
  isMounted,
  saveCurrentHole,
  setCurrentHole,
  handleNextHole,
  finishRound,
}) => {
  return (
    <View style={[styles.footer, { paddingBottom: Math.max(insetsBottom, 8) }]}>
      <TouchableOpacity 
        style={[styles.navBtn, currentHole === 1 && { opacity: 0.5 }]} 
        disabled={currentHole === 1} 
        onPress={async () => { 
          await saveCurrentHole(); 
          if (isMounted) setCurrentHole((h: number) => h - 1); 
        }}
      >
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.mainNavBtn} onPress={handleNextHole}>
        <Text style={styles.mainNavBtnText}>{currentHole === 18 ? 'ROUND FINISH' : 'NEXT HOLE'}</Text>
        <Ionicons name="chevron-forward" size={24} color="#fff" />
      </TouchableOpacity>

      {currentHole < 18 && (
        <TouchableOpacity style={styles.earlyFinishBtn} onPress={() => {
          Alert.alert("조기 종료", "현재 홀까지만 기록하고 라운딩을 마감하시겠습니까?", [
            { text: "취소", style: "cancel" },
            { text: "라운딩 마감", onPress: async () => { 
              await saveCurrentHole(); 
              if (isMounted) finishRound(); 
            } }
          ]);
        }}>
          <Ionicons name="save-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};
