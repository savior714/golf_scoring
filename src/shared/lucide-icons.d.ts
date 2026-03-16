/**
 * @file src/shared/lucide-icons.d.ts
 * @description lucide-react-native/dist/icons 경로의 직접 임포트를 위한 타입 선언
 */

declare module 'lucide-react-native/dist/icons/*' {
  import { ReactNode } from 'react';
  import { SvgProps } from 'react-native-svg';

  interface IconProps extends SvgProps {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
  }

  const Icon: (props: IconProps) => ReactNode;
  export default Icon;
}
