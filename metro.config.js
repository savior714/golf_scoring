const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const { FileStore } = require('metro-cache');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 1. Web 환경 최적화: .mjs 확장자 지원 및 분석 가속
if (!config.resolver.sourceExts.includes('mjs')) {
  config.resolver.sourceExts.push('mjs');
}

// 2. Windows I/O 최적화: Persistent Cache 강화
// 프로젝트 로컬의 .expo/metro-cache를 사용하여 Windows Defender 등의 실시간 감시 오버헤드를 줄이고 재빌드 속도 개선
config.cacheStores = [
  new FileStore({
    root: path.join(__dirname, '.expo', 'metro-cache'),
  }),
];

// 3. 파일 감시 및 스캔 성능 최적화
// node_modules 외부의 dist/ 폴더만 차단 (node_modules 내부 dist/는 패키지 배포 경로이므로 허용)
// 주의: 중첩 node_modules 전체 차단 규칙 제거 — Expo 55 웹 빌드 시 @expo/router-server 등
//       Expo CLI 내부 패키지가 node_modules/.../node_modules/... 구조로 존재하므로 차단 불가
config.resolver.blockList = [
  /test-results\/.*/,
  /^(?!.*node_modules).*\/dist\/.*/,
];

// 4. Lucide direct import 경로 리다이렉트
// lucide-react-native/dist/icons/<name> → dist/cjs/icons/<name> 자동 변환
// 패키지 exports 필드에 개별 아이콘 경로가 미정의된 v0.576.0 대응
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('lucide-react-native/dist/icons/')) {
    const iconName = moduleName.replace('lucide-react-native/dist/icons/', '');
    return context.resolveRequest(
      context,
      `lucide-react-native/dist/cjs/icons/${iconName}`,
      platform
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
