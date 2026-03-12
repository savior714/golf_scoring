import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../styles/record.styles';

interface ParSelectorProps {
  par: number;
  isParEditing: boolean;
  setPar: (p: number) => void;
  setIsParEditing: (v: boolean) => void;
}

export function ParSelector({ par, isParEditing, setPar, setIsParEditing }: ParSelectorProps) {
  return (
    <View style={styles.parSection}>
      <Text style={styles.sectionLabel}>PAR</Text>
      <View style={styles.parRow}>
        {isParEditing ? (
          [2, 3, 4, 5, 6].map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.parBtn, par === p && styles.parActive]}
              onPress={() => { setPar(p); setIsParEditing(false); }}
            >
              <Text style={[styles.parText, par === p && styles.parActiveText]}>{p}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <>
            {[3, 4, 5].map(p => (
              <TouchableOpacity key={p} style={[styles.parBtn, par === p && styles.parActive]} onPress={() => setPar(p)}>
                <Text style={[styles.parText, par === p && styles.parActiveText]}>{p}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setIsParEditing(true)} style={styles.moreParBtn}>
              <Ionicons name="ellipsis-horizontal" size={20} color="#6E85B7" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}
