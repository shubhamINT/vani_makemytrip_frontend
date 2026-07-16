import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="mmt-crash">
          <div className="mmt-crash-icon">!</div>
          <p className="mmt-crash-heading">Something went wrong</p>
          <p className="mmt-crash-detail">{this.state.error?.message}</p>
          <button className="mmt-crash-retry" onClick={this.handleReset}>
            Start over
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
