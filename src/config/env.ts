const configuredName = import.meta.env.VITE_APP_NAME?.trim();
const configuredTileUrl = import.meta.env.VITE_MAP_TILE_URL?.trim();

const defaultTileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const isValidTileUrl =
  configuredTileUrl?.startsWith('https://') &&
  configuredTileUrl.includes('{z}') &&
  configuredTileUrl.includes('{x}') &&
  configuredTileUrl.includes('{y}');

/** Public, client-side configuration only. Never place private keys in VITE_* variables. */
export const appConfig = {
  name: configuredName || 'SAETA MAPS',
  environment: import.meta.env.MODE,
  isProduction: import.meta.env.PROD,
  mapTileUrl: isValidTileUrl ? configuredTileUrl : defaultTileUrl,
} as const;
