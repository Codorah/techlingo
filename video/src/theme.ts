import timeline from './timeline.json';

// Tokens copied from src/styles/index.css of the app (light theme).
export const C = {
  mist: '#eaf6ff', sky: '#65bdf5', ocean: '#2b6cb0', oceanPress: '#1f548c',
  ink: '#17324d', ink2: '#4f6a85', line: '#d5e8f7', surface: '#ffffff',
  sun: '#fff0c7', sunInk: '#7a5a00', mint: '#d9f5e5', mintInk: '#1c7a4e', mintStrong: '#2e9e66',
  coral: '#c4513a', coralPress: '#9e3f2c', coralSoft: '#ffe6df',
  gold: '#f2b631', goldPress: '#c98f12', goldInk: '#9a6a00',
  violet: '#6a48f0', violetPress: '#4f31c4', violetSoft: '#eeeaff',
  teal: '#0b7f7b', tealPress: '#075f5c', tealSoft: '#dcf4f2',
  flame: '#ea580c', danger: '#c53b3b',
};

export const TITLE = 'Nunito, "DM Sans", system-ui, sans-serif';
export const SANS = '"DM Sans", system-ui, sans-serif';
export const MONO = '"JetBrains Mono", Consolas, monospace';

export type SceneId = (typeof timeline.scenes)[number]['id'];

export const sceneOf = (id: string) => {
  const s = timeline.scenes.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown scene ${id}`);
  return s;
};
