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
// 불필요한 깊은 경로의 node_modules 스캔을 제한하여 Metro 기동 속도 향상
config.resolver.blockList = [
  /node_modules\/.*\/node_modules\/.*/,
  /test-results\/.*/,
  /dist\/.*/,
];

module.exports = config;
