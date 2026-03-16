import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ImageSourcePropType,
  FlatList,
  Image,
  Text,
  View,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { styles } from './ServiceIntroSlider.styles';

interface Slide {
  id: string;
  title: string;
  description: string;
  image: ImageSourcePropType;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    title: '정밀한 스코어 기록',
    description: '홀별 스트로크, 퍼트, 벌타를\n간편하게 기록하세요.',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('../../../assets/images/landing_record.png') as ImageSourcePropType,
  },
  {
    id: '2',
    title: '라운딩 히스토리',
    description: '과거 모든 라운딩의 스코어카드와\n상세 내역을 관리합니다.',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('../../../assets/images/landing_history.png') as ImageSourcePropType,
  },
  {
    id: '3',
    title: '실시간 대시보드',
    description: '현재 라운딩 스코어와\n최근 5경기 트렌드를 한눈에.',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('../../../assets/images/landing_dashboard.png') as ImageSourcePropType,
  },
  {
    id: '4',
    title: '미스 패턴 분석',
    description: '나의 실수 유형을 파악하고\n약점을 집중 개선하세요.',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('../../../assets/images/landing_miss_pattern.png') as ImageSourcePropType,
  },
  {
    id: '5',
    title: '스마트 통계 분석',
    description: '버디율, GIR, 퍼트 수 등\n나의 성장을 그래프로 확인하세요.',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('../../../assets/images/landing_round_stats.png') as ImageSourcePropType,
  },
];

export function ServiceIntroSlider() {
  const { width: windowWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  // Auto-slide functionality
  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (activeIndex + 1) % SLIDES.length;
      flatListRef.current?.scrollToOffset({
        offset: nextIndex * windowWidth,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 5000);

    return () => clearInterval(timer);
  }, [activeIndex, windowWidth]);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / windowWidth);
    
    // Prevent index out of bounds
    if (index >= 0 && index < SLIDES.length) {
      setActiveIndex(index);
    }
    scrollX.value = contentOffset;
  }, [scrollX, windowWidth]);

  const renderItem = ({ item }: { item: Slide }) => {
    return (
      <View style={[styles.slide, { width: windowWidth }]}>
        <View style={[styles.imageContainer, { 
          width: windowWidth * 0.7, 
          height: windowWidth * 0.7,
          maxWidth: 320,
          maxHeight: 320,
        }]}>
          <Image
            source={item.image}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        snapToInterval={windowWidth}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: windowWidth,
          offset: windowWidth * index,
          index,
        })}
        // UI 안정성을 위해 초기 인덱스 고정 (윈도우 리사이즈 대응)
        initialScrollIndex={activeIndex}
      />
      <View style={styles.indicatorContainer}>
        {SLIDES.map((_, index) => (
          <Indicator key={index} active={activeIndex === index} />
        ))}
      </View>
    </View>
  );
}

function Indicator({ active }: { active: boolean }) {
  const width = useSharedValue(active ? 20 : 8);
  
  useEffect(() => {
    width.value = withSpring(active ? 20 : 8);
  }, [active, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
    backgroundColor: active ? '#38E54D' : '#6E85B7', // Emerald Green for active, Muted Blue for inactive
  }));

  return <Animated.View style={[styles.indicator, animatedStyle]} />;
}
