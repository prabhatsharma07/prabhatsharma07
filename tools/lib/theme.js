// Design tokens for the profile art system.
// Two themes, identical structure, so every generator can render a matched pair
// that <picture> swaps on prefers-color-scheme.

const FONT_MONO =
  "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
const FONT_SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

const dark = {
  name: 'dark',
  bg: '#05070D',
  bgDeep: '#020306',
  surface: '#0B0F18',
  surfaceAlt: '#111726',
  line: '#1B2333',
  lineSoft: '#141A28',
  text: '#E8ECF5',
  textDim: '#96A1B8',
  textFaint: '#5C6780',
  cyan: '#22D3EE',
  violet: '#A78BFA',
  magenta: '#F472B6',
  green: '#34D399',
  amber: '#FBBF24',
  // Contribution heat ramp, low -> high.
  heat: ['#131A28', '#0E4F52', '#12808C', '#1CB8C4', '#5CF0E8'],
  auroraOpacity: 0.55,
  gridOpacity: 0.5,
  starOpacity: 1,
  glow: 1,
};

const light = {
  name: 'light',
  bg: '#FCFDFF',
  bgDeep: '#EDF1F7',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F7FB',
  line: '#D6DEEA',
  lineSoft: '#E8EDF4',
  text: '#0A0F1C',
  textDim: '#4E5972',
  textFaint: '#8C97AD',
  cyan: '#0E90A8',
  violet: '#6D45E0',
  magenta: '#D62E86',
  green: '#0E9F6E',
  amber: '#B7791F',
  heat: ['#E7ECF3', '#B9E7EC', '#66C7D4', '#2196AC', '#0B6273'],
  auroraOpacity: 0.28,
  gridOpacity: 0.75,
  starOpacity: 0.22,
  glow: 0.45,
};

// On white, saturated confetti reads as dirt; keep the motes near-neutral.
light.starColors = [light.cyan, light.violet, light.textFaint];
dark.starColors = [dark.cyan, dark.violet, dark.magenta, dark.text];

const themes = { dark, light };

module.exports = { themes, dark, light, FONT_MONO, FONT_SANS };
