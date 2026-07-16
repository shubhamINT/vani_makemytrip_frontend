import { createTheme, type ThemeProps } from '@openuidev/react-ui';

// ponytail: token values point at the existing index.css brand vars — one palette, not two.
// ThemeProvider injects --openui-* onto <body>, so var(--coral) etc. resolve against :root.
export const mmtTheme: ThemeProps = {
  mode: 'light',
  lightTheme: createTheme({
    // surfaces / text
    // NB: OpenUI `foreground` is the elevated SURFACE (card panel), not text.
    // Text lives in textNeutral* below. Mapping foreground→--ink renders black cards.
    background: 'var(--paper)',
    foreground: 'var(--surface)',
    popoverBackground: 'var(--surface)',
    textNeutralPrimary: 'var(--ink)',
    textNeutralSecondary: 'var(--muted)',
    textNeutralTertiary: 'var(--faint)',
    textNeutralLink: 'var(--sky)',
    textBrand: 'var(--coral-ink)',
    // accent (coral)
    interactiveAccentDefault: 'var(--coral)',
    interactiveAccentHover: 'var(--coral-ink)',
    interactiveAccentPressed: 'var(--coral-ink)',
    textAccentPrimary: 'var(--coral-ink)',
    borderAccent: 'var(--coral)',
    // destructive
    interactiveDestructiveAccentDefault: 'var(--danger)',
    dangerBackground: '#fff4f4',
    // borders + soft state washes
    borderDefault: 'var(--line)',
    borderInteractive: 'var(--line)',
    successBackground: 'var(--sky-soft)',
    infoBackground: 'var(--sky-soft)',
    alertBackground: 'var(--coral-soft)',
    // chat bubble (if the chat lib renders one)
    chatUserResponseBg: 'var(--coral)',
    chatUserResponseText: '#ffffff',
    // radius → match .mmt-result (16 / 22px)
    radiusM: '14px',
    radiusL: 'var(--radius)',
    radiusXl: 'var(--radius-lg)',
    // typography
    fontBody: 'var(--font-body)',
    fontHeading: 'var(--font-display)',
    fontLabel: 'var(--font-display)',
    // elevation → match app shadows
    shadowS: 'var(--shadow-sm)',
    shadowM: 'var(--shadow-md)',
    shadowL: 'var(--shadow-md)',
    // charts on-brand
    defaultChartPalette: ['#ff6b4a', '#0ea5e9', '#22c55e', '#d9482a', '#8a94a6'],
  }),
};
