import { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '../../../../shared/utils/logger';

interface Props {
  children: ReactNode;
  holeNumber: number;
  onReset: () => void;
}

interface State {
  hasError: boolean;
}

/**
 * 홀 단위 국소 에러 바운더리 (Local Error Boundary)
 * 특정 홀의 입력 로직에서 에러가 발생하더라도 해당 홀 UI만 초기화하고 
 * 라운딩 전체가 중단되는 것을 방지합니다.
 */
export class HoleErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(`[HoleErrorBoundary] catch (${this.props.holeNumber})`, {
      error: error.toString(),
      componentStack: errorInfo.componentStack
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="warning-outline" size={40} color="#FF9500" />
          <Text style={styles.title}>데이터 처리 중 오류</Text>
          <Text style={styles.message}>
            {this.props.holeNumber}번 홀의 입력 상태를 초기화하고
다시 시도해 주세요.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>이 홀 초기화 및 다시 시도</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
    marginTop: 12,
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    color: '#B45309',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});