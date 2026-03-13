import { useRef, useState } from 'react';
import { Platform } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { View } from 'react-native';

interface UseScoreCardShareOptions {
  courseName?: string;
  date?: string;
}

export function useScoreCardShare({ courseName, date }: UseScoreCardShareOptions) {
  const viewShotRef = useRef<ViewShot>(null);
  const scoreCardDomRef = useRef<View>(null);
  const statGridViewShotRef = useRef<ViewShot>(null);
  const statGridDomRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);

  const shareOnWeb = async () => {
    const { toPng } = await import('html-to-image');
    const scoreEl = scoreCardDomRef.current as unknown as HTMLElement;
    const statsEl = statGridDomRef.current as unknown as HTMLElement;
    if (!scoreEl || !statsEl) return;

    const label = date ?? 'golf';
    const [scoreDataUrl, statsDataUrl] = await Promise.all([
      toPng(scoreEl, { backgroundColor: '#ffffff', pixelRatio: 2 }),
      toPng(statsEl, { backgroundColor: '#F8F9FA', pixelRatio: 2 }),
    ]);

    const [scoreBlob, statsBlob] = await Promise.all([
      fetch(scoreDataUrl).then(r => r.blob()),
      fetch(statsDataUrl).then(r => r.blob()),
    ]);

    const scoreFile = new File([scoreBlob], `scorecard_${label}.png`, { type: 'image/png' });
    const statsFile = new File([statsBlob], `stats_${label}.png`, { type: 'image/png' });

    if (navigator.canShare?.({ files: [scoreFile, statsFile] })) {
      await navigator.share({
        files: [scoreFile, statsFile],
        title: '골프 라운딩 결과',
        text: `${courseName ?? ''} 라운딩 결과`,
      });
    } else {
      for (const [file, blob] of [[scoreFile, scoreBlob], [statsFile, statsBlob]] as [File, Blob][]) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  const shareOnNative = async () => {
    const scoreUri = viewShotRef.current?.capture ? await viewShotRef.current.capture() : null;
    const statsUri = statGridViewShotRef.current?.capture ? await statGridViewShotRef.current.capture() : null;

    if (scoreUri) {
      await Sharing.shareAsync(scoreUri, {
        mimeType: 'image/png',
        dialogTitle: '스코어카드 공유',
        UTI: 'public.png',
      });
    }
    if (statsUri) {
      await Sharing.shareAsync(statsUri, {
        mimeType: 'image/png',
        dialogTitle: '라운드 통계 공유',
        UTI: 'public.png',
      });
    }
  };

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      if (Platform.OS === 'web') {
        await shareOnWeb();
      } else {
        await shareOnNative();
      }
    } finally {
      setIsSharing(false);
    }
  };

  return {
    viewShotRef,
    scoreCardDomRef,
    statGridViewShotRef,
    statGridDomRef,
    isSharing,
    handleShare,
  };
}
