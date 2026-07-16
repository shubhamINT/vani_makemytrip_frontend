import { ThemeProvider } from '@openuidev/react-ui';
import Concierge from './app/Concierge';
import { mmtTheme } from './app/theme';

export default function App() {
  return (
    <ThemeProvider {...mmtTheme}>
      <Concierge />
    </ThemeProvider>
  );
}
