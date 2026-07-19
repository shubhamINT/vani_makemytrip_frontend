import { ThemeProvider } from '@openuidev/react-ui';
import Concierge from './components/Concierge';
import { mmtTheme } from './theme';

export default function App() {
  return (
    <ThemeProvider {...mmtTheme}>
      <Concierge />
    </ThemeProvider>
  );
}
