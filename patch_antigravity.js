
const fs = require('fs');
const path = require('path');

const targetPath = 'C:\\Users\\savio\\AppData\\Local\\Programs\\Antigravity\\resources\\app\\out\\jetskiAgent\\main.js';
const backupPath = targetPath + '.bak';

console.log('--- Antigravity Flickering Patch Start ---');

// 1. 원본 백업
if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(targetPath, backupPath);
    console.log('Backup created:', backupPath);
}

// 2. 파일 읽기
let content = fs.readFileSync(targetPath, 'utf8');

// 3. 패턴 분석 및 치환
// Node.js의 child_process.spawn(command, args, options) 호출을 찾습니다.
// 미니파이드된 코드에서는 보통 .spawn(x, y, z) 형태입니다.
// z에 windowsHide:true를 강제로 넣어야 합니다.

// 가장 안전한 방법은 spawn() 호출 시 전달되는 세 번째 인자(객체)를 찾아 
// 그 안에 windowsHide:true를 주입하는 것입니다.
// 여기서는 범용적으로 child_process 모듈이 spawn을 정의하거나 호출하는 지점을 공략합니다.

console.log('Analyzing main.js for spawn patterns...');

// 패턴: .spawn(???, ???, { ... }) -> .spawn(???, ???, { windowsHide: true, ... })
// 또는 .spawn(???, ???, optionsVar) -> .spawn(???, ???, Object.assign({windowsHide:true}, optionsVar))

const originalLength = content.length;

// Electron 환경에서 spawn 옵션 전역 주입 패치 (가장 확실한 방법)
// .spawn(a,b,c) 형태에서 c에 windowsHide를 섞어줍니다.
// 정규식 설명: .spawn(인자1, 인자2, 인자3)을 찾아서 인자3 부분에 windowsHide 주입
// 주의: 인자3이 변수일 수도 있고 객체 리터럴일 수도 있음

// 보다 근본적인 패치: child_process.spawn의 옵션을 가로채는 로직을 상단에 주입하는 것도 방법입니다.
const patchCode = `
if (process.platform === 'win32') {
    const cp = require('child_process');
    const originalSpawn = cp.spawn;
    cp.spawn = function(cmd, args, opts) {
        if (opts && typeof opts === 'object') {
            opts.windowsHide = true;
        } else if (!opts) {
            opts = { windowsHide: true };
        }
        return originalSpawn.call(this, cmd, args, opts);
    };
}
`;

// main.js 파일의 시작 부분에 이 패치 코드를 삽입합니다. 
// 이렇게 하면 main.js 내의 어떤 spawn 호출이든 적용됩니다.
if (!content.includes('windowsHide = true')) {
    content = patchCode + content;
    fs.writeFileSync(targetPath, content, 'utf8');
    console.log('Patch Applied Successfully! (Global Hook Method)');
} else {
    console.log('Patch already applied or similar logic found.');
}

console.log('--- Done! Please restart Antigravity. ---');
