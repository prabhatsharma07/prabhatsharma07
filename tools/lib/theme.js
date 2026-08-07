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
  heat: ['#131A28', '#0E4F52', '#12808C', '#1CB8C4', '#5CF0E8'],
  aurora: 0.55,
  gridLines: 0.5,
  stars: 1,
  glow: 1,
  surfaceFill: 0.55,
  chipFill: 0.82,
  chipStroke: 0.42,
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
  aurora: 0.28,
  gridLines: 0.75,
  stars: 0.22,
  glow: 0.45,
  surfaceFill: 0.75,
  chipFill: 0.95,
  chipStroke: 0.5,
};

dark.starColors = [dark.cyan, dark.violet, dark.magenta, dark.text];
light.starColors = [light.cyan, light.violet, light.textFaint];

dark.vignette = 0.85;
light.vignette = 0.4;

const themes = { dark, light };

module.exports = { themes, dark, light };
